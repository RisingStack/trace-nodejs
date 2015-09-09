var events = require('events');
var util = require('util');
var fs = require('fs');

var debug = require('debug')('risingstack/trace');
var microtime = require('microtime');

var config = require('./config');
var getNamespace = require('continuation-local-storage').getNamespace;

/*
 * @class Collector
 * @constructs Collector
 * @extends events.EventEmitter
 */
function Collector(options) {
  debug('collector is initializing...');
  events.EventEmitter.call(this);

  this.apiKey = options.apiKey;
  this.collectInterval = options.collectInterval;
  this.isSampled = true;
  this.reporter = options.reporter;
  this.sampleRate = 1;
  this.sampleSize = options.sampleSize;
  this.store = {};

  this.on(Collector.CLIENT_RECV, this.onClientReceive);
  this.on(Collector.CLIENT_SEND, this.onClientSend);
  this.on(Collector.SERVER_RECV, this.onServerReceive);
  this.on(Collector.SERVER_SEND, this.onServerSend);

  this.formattableLogFile = config.logFilePath + config.logFilePrefix + '%s.log';

  this._updateLogFile();

  debug('collector initialized');
}

util.inherits(Collector, events.EventEmitter);

Collector.prototype.startCollecting = function () {
  debug('collector started collecting');
  var _this = this;
  this.intervalId = setInterval(function () {
    if (_this.isSampled && (typeof _this.service !== 'undefined')) {
      _this._send(_this.logFile);
      _this._updateLogFile();
    }
  }, this.collectInterval);
};

Collector.prototype.stopCollecting = function () {
  debug('collector stopped collecting');
  clearInterval(this.intervalId);
};

Collector.prototype.setService = function (serviceId) {
  debug('collector service is set to: ', serviceId);
  this.service = serviceId;
};

Collector.prototype.getService = function () {
  return this.service;
};

Collector.prototype.setSampled = function (isSampled) {
  if (typeof isSampled !== 'undefined') {
    this.isSampled = isSampled;
    this.sampleRate = 1;
  } else {
    this.isSampled = (1 / this.sampleRate) > Math.random();
  }
};

Collector.prototype._initTrace = function (data) {
  this.store[data.id] = this.store[data.id] || {
    span: data.url,
    events: []
  };

  var trace = this.store[data.id];

  trace.trace = trace.trace || data.id;
  trace.service = trace.service || this.service;
  trace.host = trace.host || data.host;

  return trace;
};

Collector.prototype.onCrash = function (data) {
  var trace = this._initTrace(data);

  trace.events.push({
    time: data.time,
    type: 'st',
    data: {
      trace: data.stackTrace
    }
  });

  this.writeToFile(trace, true);
};

Collector.prototype.onClientSend = function (data) {
  var trace = this._initTrace(data);
  var spanId;

  if (data.headers) {
    spanId = data.headers['x-span-id'];
  }

  trace.events.push({
    id: spanId,
    time: data.time,
    type: Collector.CLIENT_SEND
  });
};

Collector.prototype.onClientReceive = function (data) {
  var trace = this._initTrace(data);
  var spanId;

  if (data.headers) {
    spanId = data.headers['x-span-id'];
  }

  trace.events.push({
    id: spanId,
    time: data.time,
    type: Collector.CLIENT_RECV,
    data: data.err,
    statusCode: data.statusCode
  });
};

Collector.prototype.writeToFile = function (trace, isSync) {
  var _this = this;

  if (isSync) {
    try {
      fs.writeFileSync(_this.logFile, JSON.stringify(trace) + ',\n', {flag: 'a'});
    } catch (ex) {
      debug('Could not write file: ', ex);
    }
  } else {
    fs.writeFile(_this.logFile,
      JSON.stringify(trace) + ',\n', {flag: 'a'}, function (err) {
        if (err) {
          return debug('Could not write file: ', err);
        }

        delete _this.store[trace.trace];
      });
  }
};

Collector.prototype.onServerSend = function (data) {
  var hasStackTrace;

  if (this.store[data.id] && this.store[data.id].events) {
    hasStackTrace = this.store[data.id].events.some(function (event) {
      return event.type === 'st';
    });
  }

  if (hasStackTrace) {
    delete this.store[data.id];
    return;
  }

  var headers = data.headers;
  var spanId = headers['x-span-id'];

  var trace = this._initTrace(data);

  trace.statusCode = data.statusCode;
  trace.events.push({
    id: spanId,
    time: data.time,
    type: Collector.SERVER_SEND
  });

  if (trace.statusCode > 399 || this.isSampled) {
    this.writeToFile(trace);
  } else {
    delete this.store[data.id];
  }
};

Collector.prototype.onServerReceive = function (data) {
  var headers = data.headers;
  var spanId = headers['x-span-id'];
  var parentId = headers['x-parent'];
  var originTime = headers['x-client-send'];

  var trace = this._initTrace(data);
  trace.origin = originTime;
  trace.parent = parentId;
  trace.events.push({
    id: spanId,
    time: data.time,
    type: Collector.SERVER_RECV
  });
};

Collector.prototype._updateLogFile = function () {
  this.logFile = util.format(this.formattableLogFile, Date.now());
};

Collector.prototype.report = function (data) {
  var session = getNamespace('trace');
  var traceId = session.get('request-id');

  this.store[traceId] = this.store[traceId] || {
    span: data.url,
    events: []
  };

  var dataToSend = {
    time: microtime.now(),
    data: data,
    type: 'us'
  };
  this.store[traceId].events = this.store[traceId].events || [];
  this.store[traceId].events.push(dataToSend);
};

Collector.prototype._send = function (logFile) {
  var _this = this;

  debug('sending logs to the trace service');

  fs.readFile(logFile, 'utf-8', function (err, data) {
    var dataBag = {};
    if (err && err.code === 'ENOENT') {
      return;
    }
    if (err) {
      return console.error(err);
    }

    data = '[' + data.substring(0, data.length - 2) + ']';
    data = JSON.parse(data);

    dataBag.sampleRate = _this.sampleRate;
    dataBag.samples = data;

    _this.sampleRate = Math.floor(data.length / _this.sampleSize) || 1;

    _this.reporter.send(dataBag, function (err) {
      debug('logs sent to the trace service');
      if (err) {
        debug(err);
      }

      // do nothing if file cannot be removed
      // mostl likely it is because it was never created in the first place
      fs.unlink(logFile, function() {});
    });
  });
};

// Statics
Collector.CLIENT_SEND = 'cs';
Collector.CLIENT_RECV = 'cr';
Collector.SERVER_SEND = 'ss';
Collector.SERVER_RECV = 'sr';

// Module interface
module.exports = Collector;
