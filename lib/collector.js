var events = require('events');
var util = require('util');

var debug = require('debug')('risingstack/trace');
var cloneDeep = require('lodash/lang/cloneDeep');
var microtime = require('microtime');

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
  this.reporter = options.reporter;
  this.sampleRate = 1;
  this.sampleSize = options.sampleSize;
  this.partials = {};
  this.traces = [];

  this.on(Collector.CLIENT_RECV, this.onClientReceive);
  this.on(Collector.CLIENT_SEND, this.onClientSend);
  this.on(Collector.SERVER_RECV, this.onServerReceive);
  this.on(Collector.SERVER_SEND, this.onServerSend);

  debug('collector initialized');
}

util.inherits(Collector, events.EventEmitter);

Collector.prototype.startCollecting = function () {
  debug('collector started collecting');
  var _this = this;
  this.intervalId = setInterval(function () {
    if (typeof _this.service !== 'undefined') {
      _this._send();
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

Collector.prototype._initTrace = function (data) {
  data.id = data.id || '';
  this.partials[data.id] = this.partials[data.id] || {
    span: data.url,
    events: []
  };

  var trace = this.partials[data.id];

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

  this.traces.push(trace);

  this._send({
    isSync: true
  });
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

  if (data.err) {
    trace.isSampled = true;
  }

  trace.events.push({
    id: spanId,
    time: data.time,
    type: Collector.CLIENT_RECV,
    data: data.err,
    statusCode: data.statusCode
  });
};

Collector.prototype.onServerSend = function (data) {
  var headers = data.headers;
  var spanId = headers['x-span-id'];

  var trace = this._initTrace(data);
  trace.statusCode = data.statusCode;
  trace.events.push({
    id: spanId,
    time: data.time,
    type: Collector.SERVER_SEND
  });

  var isSampled = trace.isSampled || this.sampleRate > Math.random();

  if (trace.statusCode > 399 || isSampled) {
    delete trace.isSampled;
    this.traces.push(trace);
  }

  delete this.partials[data.id];
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

Collector.prototype.report = function (data) {
  var session = getNamespace('trace');
  var traceId = session.get('request-id');

  this.partials[traceId] = this.partials[traceId] || {
    span: data.url,
    events: []
  };

  var dataToSend = {
    time: microtime.now(),
    data: data,
    type: 'us'
  };
  this.partials[traceId].events = this.partials[traceId].events || [];
  this.partials[traceId].events.push(dataToSend);
};

Collector.prototype._send = function (options) {
  options = options || {};
  debug('sending logs to the trace service');
  if (this.traces.length > 0) {
    var dataBag = {};
    dataBag.sampleRate = this.sampleRate;
    dataBag.samples = cloneDeep(this.traces);

    this.sampleRate = Math.floor(dataBag.samples.length / this.sampleSize) || 1;

    this.traces = [];

    if (options.isSync) {
      this.reporter.sendSync(dataBag);
    } else {
      this.reporter.send(dataBag, function (err) {
        debug('logs sent to the trace service');
        if (err) {
          return debug(err);
        }
      });
    }
  }
};

// Statics
Collector.CLIENT_SEND = 'cs';
Collector.CLIENT_RECV = 'cr';
Collector.SERVER_SEND = 'ss';
Collector.SERVER_RECV = 'sr';

// Module interface
module.exports = Collector;
