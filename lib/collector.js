var events = require('events');
var util = require('util');
var fs = require('fs');
var path = require('path');

var debug = require('debug')('trace-collector');

var microtime = require('microtime');

var getNamespace = require('continuation-local-storage').getNamespace;

/*
 * @class Collector
 * @constructs Collector
 * @extends events.EventEmitter
 */
function Collector(options) {
  events.EventEmitter.call(this);

  this.collectInterval = options.collectInterval;
  this.sampleSize = options.sampleSize;
  this.apiKey = options.apiKey;
  this.sampleRate = 1;
  this.store = {};
  this.isSampled = true;
  this.reporter = options.reporter;

  this.on(Collector.CLIENT_SEND, this.onClientSend);
  this.on(Collector.CLIENT_RECV, this.onClientReceive);
  this.on(Collector.SERVER_SEND, this.onServerSend);
  this.on(Collector.SERVER_RECV, this.onServerReceive);

  this._updateLogFile();
}

util.inherits(Collector, events.EventEmitter);

Collector.prototype.startCollecting = function () {
  var _this = this;
  this.intervalId = setInterval(function () {
    if (_this.isSampled && (typeof _this.service !== 'undefined')) {
      _this._send(_this.logFile);
      _this._updateLogFile();
    }
  }, this.collectInterval);
};

Collector.prototype.stopCollecting = function () {
  clearInterval(this.intervalId);
};

Collector.prototype.setService = function (serviceId) {
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

  trace.trace = data.id;
  trace.service = this.service;
  trace.host = data.host;

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

  var spanId = data.headers['x-span-id'] ? data.headers['x-span-id'] : null;
  trace.events.push({
    id: spanId,
    time: data.time,
    type: Collector.CLIENT_SEND
  });
};

Collector.prototype.onClientReceive = function (data) {
  debug(Collector.CLIENT_RECV, data);

  var trace = this._initTrace(data);
  var spanId = data.headers['x-span-id'] ? data.headers['x-span-id'] : null;
  trace.statusCode = data.statusCode ? data.statusCode : null;
  trace.events.push({
    id: spanId,
    time: data.time,
    type: Collector.CLIENT_RECV,
    data: data.err
  });
};

Collector.prototype.writeToFile = function (trace, isSync) {
  var _this = this;

  if (isSync) {
    fs.writeFileSync(_this.logFile, JSON.stringify(trace) + ',\n', {flag: 'a'});
  } else {
    fs.writeFile(_this.logFile,
      JSON.stringify(trace) + ',\n', {flag: 'a'}, function (err) {
        if (err) {
          return console.log(err);
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
  var parentId;
  var originTime;
  var spanId;

  var headers = data.headers;
  spanId = headers['x-span-id'];
  parentId = headers['x-parent'];
  originTime = headers['x-client-send'];

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
  this.logFile = path.join(__dirname, '../../', util.format('../trace_%s.log', Date.now()));
};

Collector.prototype.report = function (data) {
  var session = getNamespace('trace');
  var traceId = session.get('request-id');

  debug('Trace id: ', traceId);

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

  fs.readFile(logFile, 'utf-8', function (err, data) {
    var dataBag = {};
    if (err && err.code === 'ENOENT') {
      return;
    }
    if (err) {
      return console.log(err);
    }

    data = '[' + data.substring(0, data.length - 2) + ']';
    data = JSON.parse(data);

    dataBag.sampleRate = _this.sampleRate;
    dataBag.samples = data;

    _this.sampleRate = Math.floor(data.length / _this.sampleSize) || 1;

    _this.reporter.send(dataBag, function (err) {
      if (err) {
        debug(err);
      }

      fs.unlink(logFile);
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
