var https = require('https');
var url = require('url');
var util = require('util');
var requestSync = require('sync-request');
var debug = require('debug')('risingstack/trace');

var bl = require('bl');
var package = require('../../../package');

var config = require('../../config');

var COLLECTOR_API_SAMPLE = url.resolve(config.collectorApi, config.collectorApiSampleEndpoint);
var COLLECTOR_API_SERVICE = url.resolve(config.collectorApi, config.collectorApiServiceEndpoint);
var COLLECTOR_API_METRICS = url.resolve(config.collectorApi, config.collectorApiMetricsEndpoint);

function TraceReporter (options) {
  this.apiKey = options.apiKey || process.env.TRACE_API_KEY;
  this.appName = options.appName || process.env.TRACE_APP_NAME;
  this.baseRetryInterval = 100;
  this.retryCount = 0;
  this.retryLimit = 13;

  //check if everything is ok with config
  if (!this.apiKey) {
    throw new Error('Missing apiKey');
  }
}

TraceReporter.prototype.setEventBus = function (eventBus) {
  this.eventBus = eventBus;
  this.eventBus.on(this.eventBus.HTTP_TRANSACTION_STACK_TRACE, this.sendSync.bind(this));
  this.eventBus.on(this.eventBus.HTTP_TRANSACTION, this.send.bind(this));
  this.eventBus.on(this.eventBus.APM_METRICS, this.sendMetrics.bind(this));
  this.getService();
};

TraceReporter.prototype.sendMetrics = function (data) {
  if (!this.serviceId) {
    return debug('Service id not present, cannot send metrics');
  }

  var payload = JSON.stringify(data);
  var opts = url.parse(util.format(COLLECTOR_API_METRICS, this.serviceId));

  var req = https.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': package.version,
      'Content-Length': payload.length
    }
  }, function (res) {
    res.setEncoding('utf8');
    res.pipe(bl(function (err) {
      if (err) {
        return debug('There was an error when connecting to the Trace API', err);
      }

      debug('Metrics sent successfully');
    }));
  });

  debug('sending metrics to trace servers: ', payload);
  req.write(payload);
  req.end();
};
// USE THIS WITH CAUTION, IT WILL BE BLOCKING
TraceReporter.prototype.sendSync = function (data) {
  debug('sending data to trace servers sync: ', JSON.stringify(data));
  requestSync('POST', COLLECTOR_API_SAMPLE, {
    json: data,
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': package.version
    },
    timeout: 1000
  });
};

TraceReporter.prototype.send = function (data) {

  var opts = url.parse(COLLECTOR_API_SAMPLE);
  var payload = JSON.stringify(data);

  var req = https.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': package.version,
      'Content-Length': payload.length
    }
  }, function (res) {
    res.setEncoding('utf8');
    res.pipe(bl(function (err) {
      if (err) {
        return debug('There was an error when connecting to the Trace API', err);
      }

      debug('HTTP Traces sent successfully');
    }));
  });

  debug('sending http transactions to trace servers: ', payload);
  req.write(payload);
  req.end();
};

TraceReporter.prototype._getRetryInterval = function() {
  var retryInterval = Math.pow(2, this.retryCount) * this.baseRetryInterval;
  debug('retrying with %d ms', retryInterval);
  return retryInterval;
};

TraceReporter.prototype.getService = function() {

  debug('getting service id from the trace servers');

  var opts = url.parse(COLLECTOR_API_SERVICE);
  var _this = this;

  var payload = JSON.stringify({
    name: _this.appName
  });

  var req = https.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': package.version,
      'Content-Length': payload.length
    }
  }, function (res) {

    res.setEncoding('utf8');
    res.pipe(bl(function (err, resBuffer) {
      var response;

      if (err) {
        return debug('There was an error when connecting to the Trace API', err);
      }

      var resText = resBuffer.toString('utf8');

      debug('raw response from trace servers: ', resText);
      if (res.statusCode > 399) {
        if (++_this.retryCount < _this.retryLimit) {
          return setTimeout(function () {
              _this.getService();
            }, _this._getRetryInterval());
        }

        return _this.eventBus.emit(_this.eventBus.ERROR,
          'The trace collector-api is currently unavailable');
      }

      try {
        response = JSON.parse(resText);
      } catch (ex) {
        debug('Error parsing JSON:', ex);
        return debug(ex);
      }

      _this.serviceId = response.key;
      return _this.eventBus.emit(_this.eventBus.TRACE_SERVICE_KEY, response.key);
    }));
  });

  req.write(payload);
  req.end();
};

function create(options) {
  return new TraceReporter(options);
}

module.exports.create = create;
