var events = require('events');
var util = require('util');
var fs = require('fs');
var path = require('path');

var debug = require('debug')('seetru');

var superagent = require('superagent');
var microtime = require('microtime');

var getNamespace = require('continuation-local-storage').getNamespace;

var COLLECTOR_API = 'https://seetru-collector-staging.herokuapp.com/service/sample';

/*
 * @class Collector
 * @constructs Collector
 * @extends events.EventEmitter
 */
function Collector(options) {
  events.EventEmitter.call(this);

  this.app = options.app;
  this.service = options.service;
  this.collectInterval = options.collectInterval;
  this.sampleSize = options.sampleSize;
  this.sampleRate = 1;
  this.store = {};
  this.isSampled = true;

  this.on(Collector.CLIENT_SEND, this.onClientSend);
  this.on(Collector.CLIENT_RECV, this.onClientReceive);
  this.on(Collector.SERVER_SEND, this.onServerSend);
  this.on(Collector.SERVER_RECV, this.onServerReceive);

  process.__seetru = this.store;

  this._updateLogFile();
}

util.inherits(Collector, events.EventEmitter);

Collector.prototype.startCollecting = function () {
  var _this = this;
  this.intervalId = setInterval(function () {
    if (_this.isSampled) {
      _this._send();
    }
  }, this.collectInterval);
};

Collector.prototype.stopCollecting = function () {
  clearInterval(this.intervalId);
};

Collector.prototype.setSampled = function (isSampled) {
  if (typeof isSampled !== 'undefined') {
    this.isSampled = isSampled;
    this.sampleRate = 1;
  } else {
    this.isSampled = (1 / this.sampleRate) > Math.random();
  }
};

Collector.prototype.onCrash = function (data) {
  this.store[data.id] = this.store[data.id] || {
    span: data.url,
    events: []
  };

  var trace = this.store[data.id];

  trace.trace = data.id;
  trace.service = this.service;
  trace.host = data.host;
  trace.events.push({
    time: data.time,
    type: 'st',
    data: data.trace
  });
};

Collector.prototype.onClientSend = function (data) {
  this.store[data.id] = this.store[data.id] || {
    span: data.url,
    events: []
  };

  var trace = this.store[data.id];

  debug(Collector.CLIENT_SEND, data);

  trace.trace = data.id;
  trace.service = this.service;
  trace.host = data.host;
  trace.events.push({
    time: data.time,
    type: Collector.CLIENT_SEND
  });
};

Collector.prototype.onClientReceive = function (data) {
  this.store[data.id] = this.store[data.id] || {
    span: data.url,
    events: []
  };

  var trace = this.store[data.id];

  debug(Collector.CLIENT_RECV, data);

  trace.trace = data.id;
  trace.service = this.service;
  trace.host = data.host;
  trace.statusCode = data.statusCode;
  trace.events.push({
    time: data.time,
    type: Collector.CLIENT_RECV
  });
};

Collector.prototype.onServerSend = function (data) {
  var _this = this;
  this.store[data.id] = this.store[data.id] || {
    span: data.url,
    events: []
  };

  var trace = this.store[data.id];

  debug(Collector.SERVER_SEND, data);

  trace.trace = data.id;
  trace.service = this.service;
  trace.host = data.host;
  trace.events.push({
    time: data.time,
    type: Collector.SERVER_SEND
  });

  if (trace.statusCode > 399 || this.isSampled) {
    fs.writeFile(_this.logFile,
      JSON.stringify(trace) + ',\n', {flag: 'a'}, function (err) {
        if (err) {
          return console.log(err);
        }

        delete _this.store[data.id];
      });
  } else {
    delete _this.store[data.id];
  }

};

Collector.prototype.onServerReceive = function (data) {
  this.store[data.id] = this.store[data.id] || {
    span: data.url,
    events: []
  };

  var trace = this.store[data.id];

  var parentId;
  var originTime;
  var requestInfo;

  if (data.seetruData) {
    requestInfo = data.seetruData.split('-');
    originTime = requestInfo[0];
    parentId = requestInfo[1];
  }

  debug(Collector.SERVER_RECV, data);

  trace.trace = data.id;
  trace.service = this.service;
  trace.origin = originTime;
  trace.parent = parentId;
  trace.host = data.host;
  trace.events.push({
    time: data.time,
    type: Collector.SERVER_RECV
  });

};

Collector.prototype._updateLogFile = function () {
  this.logFile = path.join(__dirname, util.format('../seetru_trace_%s_%s.log',
    this.service, Date.now()));
};

Collector.prototype.report = function (data) {
  var session = getNamespace('seetru');
  var traceId = session.get('request-id');

  this.store[traceId] = this.store[traceId] || {
    span: data.url,
    events: []
  };

  var dataToSend = {
    time: microtime.now(),
    data: data
  };

  this.store[traceId].events = this.store[traceId].events || [];
  this.store[traceId].events.push(dataToSend);
};

Collector.prototype._send = function () {

  var _oldLogFile = this.logFile;
  var _this = this;

  this._updateLogFile();

  fs.readFile(_oldLogFile, 'utf-8', function (err, data) {
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

    superagent
      .post(COLLECTOR_API)
      .send(dataBag)
      .end(function (err) {
        if (err) {
          debug(err);
        }

        fs.unlink(_oldLogFile);
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
