var events = require('events');
var util = require('util');

var debug = require('debug')('risingstack/trace');
var cloneDeep = require('lodash/lang/cloneDeep');
var microtime = require('microtime');

var getNamespace = require('continuation-local-storage').getNamespace;
var wraps = require('./wraps');

/*
 * @class HttpTransaction
 * @constructs HttpTransaction
 * @extends events.EventEmitter
 */
function HttpTransaction(eventBus, options) {
  debug('HttpTransaction is initializing...');

  this.eventBus = eventBus;
  events.EventEmitter.call(this);

  this.apiKey = options.apiKey;
  this.collectInterval = options.collectInterval;
  this.sampleRate = 1;
  this.sampleSize = options.sampleSize;
  this.partials = {};
  this.traces = [];
  this.rpmMetrics = {};
  this.totalRequestCount = 0;

  this.on(HttpTransaction.CLIENT_RECV, this.onClientReceive);
  this.on(HttpTransaction.CLIENT_SEND, this.onClientSend);
  this.on(HttpTransaction.SERVER_RECV, this.onServerReceive);
  this.on(HttpTransaction.SERVER_SEND, this.onServerSend);

  wraps.instrument(this, options);

  this.eventBus.on(this.eventBus.TRACE_SERVICE_KEY, this.setService.bind(this));
  this.eventBus.on(this.eventBus.USER_SENT_EVENT, this.report.bind(this));
}

util.inherits(HttpTransaction, events.EventEmitter);

HttpTransaction.prototype.startCollecting = function () {
  debug('HttpTransaction started collecting');
  var _this = this;
  this.transactionIntervalId  = setInterval(function () {
    _this._send();
  }, this.collectInterval);
  this.rpmMetricsIntervalId = setInterval(function () {
    _this._sendRpm();
  }, 60 * 1000);
};

HttpTransaction.prototype.stopCollecting = function () {
  debug('HttpTransaction stopped collecting');
  clearInterval(this.transactionIntervalId);
  clearInterval(this.rpmMetricsIntervalId);
};

HttpTransaction.prototype.getService = function () {
  return this.service;
};

HttpTransaction.prototype.setService = function (serviceId) {
  debug('HttpTransaction service is set to: ', serviceId);
  debug('HttpTransaction initialized');
  this.service = serviceId;
  this.startCollecting();
};

HttpTransaction.prototype._initTrace = function (data) {
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

HttpTransaction.prototype.onCrash = function (data) {
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

HttpTransaction.prototype.onClientSend = function (data) {
  var trace = this._initTrace(data);
  var spanId;

  if (data.headers) {
    spanId = data.headers['x-span-id'];
  }

  trace.events.push({
    host: data.host,
    url: data.url,
    id: spanId,
    method: data.method,
    time: data.time,
    type: HttpTransaction.CLIENT_SEND
  });
};

HttpTransaction.prototype.onClientReceive = function (data) {
  var trace = this._initTrace(data);

  if (data.err) {
    trace.isSampled = true;
  }

  trace.events.push({
    id: data.spanId,
    host: data.host,
    url: data.url,
    time: data.time,
    type: HttpTransaction.CLIENT_RECV,
    data: data.err,
    statusCode: data.statusCode
  });
};

HttpTransaction.prototype.onServerSend = function (data) {
  var headers = data.headers;
  var spanId = headers['x-span-id'];

  var trace = this._initTrace(data);
  trace.statusCode = data.statusCode;
  trace.events.push({
    id: spanId,
    time: data.time,
    type: HttpTransaction.SERVER_SEND
  });

  var isSampled = trace.isSampled || (1 / this.sampleRate) > Math.random();
  if (data.mustCollect || isSampled) {
    trace.isForceSampled = !!trace.isSampled;
    delete trace.isSampled;

    this.traces.push(trace);
  }

  this.collectStatusCode(trace);
  delete this.partials[data.id];
};

HttpTransaction.prototype.collectStatusCode = function (trace) {
  if (!this.rpmMetrics[trace.statusCode]) {
    this.rpmMetrics[trace.statusCode] = 1;
  } else {
    this.rpmMetrics[trace.statusCode]++;
  }
};

HttpTransaction.prototype.onServerReceive = function (data) {
  this.totalRequestCount++;
  var headers = data.headers;
  var spanId = headers['x-span-id'];
  var parentId = headers['x-parent'];
  var originTime = headers['x-client-send'];

  var trace = this._initTrace(data);
  trace.method = data.method;
  trace.origin = originTime;
  trace.parent = parentId;
  trace.events.push({
    id: spanId,
    time: data.time,
    type: HttpTransaction.SERVER_RECV
  });
};

HttpTransaction.prototype.report = function (data) {
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

HttpTransaction.prototype._sendRpm = function () {
  debug('sending rpm metrics to the trace service');
  if (Object.keys(this.rpmMetrics).length > 0) {
    var dataBag = {};
    dataBag.requests = cloneDeep(this.rpmMetrics);
    dataBag.timestamp = new Date().toISOString();

    this.eventBus.emit(this.eventBus.RPM_METRICS, dataBag);
    this.rpmMetrics = {};
  }
};

HttpTransaction.prototype._send = function (options) {
  options = options || {};
  debug('sending logs to the trace service');
  if (this.traces.length > 0) {
    var dataBag = {};
    dataBag.sampleRate = this.sampleRate;
    dataBag.samples = cloneDeep(this.traces);
    dataBag.totalRequestCount = this.totalRequestCount;

    this.sampleRate = Math.floor(this.totalRequestCount / this.sampleSize) || 1;
    this.totalRequestCount = 0;

    this.traces = [];

    if (options.isSync) {
      this.eventBus.emit(this.eventBus.HTTP_TRANSACTION_STACK_TRACE, dataBag);
    } else {
      this.eventBus.emit(this.eventBus.HTTP_TRANSACTION, dataBag);
      debug('logs are being sent to the trace service');
    }
  }
};

// Statics
module.exports.CLIENT_SEND = HttpTransaction.CLIENT_SEND = 'cs';
module.exports.CLIENT_RECV = HttpTransaction.CLIENT_RECV = 'cr';
module.exports.SERVER_SEND = HttpTransaction.SERVER_SEND = 'ss';
module.exports.SERVER_RECV = HttpTransaction.SERVER_RECV = 'sr';

function create (events, config) {
  return new HttpTransaction(events, config);
}

module.exports.create = create;
