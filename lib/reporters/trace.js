var https = require('https');
var url = require('url');
var debug = require('debug')('risingstack/trace');

var bl = require('bl');
var package = require('../../package');

var config = require('../config');

var COLLECTOR_API_SAMPLE = url.resolve(config.collectorApi, config.collectorApiSampleEndpoint);
var COLLECTOR_API_SERVICE = url.resolve(config.collectorApi, config.collectorApiServiceEndpoint);

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

  if (!this.appName) {
    throw new Error('Missing appName');
  }
}

TraceReporter.prototype.send = function (data, callback) {

  var opts = url.parse(COLLECTOR_API_SAMPLE);

  var req = https.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': package.version
    }
  }, function (res) {
    res.setEncoding('utf8');
    res.pipe(bl(function (err) {
      if (err) {
        debug('There was an error when connecting to the Trace API', err);
        return callback(err);
      }

      callback();
    }));
  });

  var payload = JSON.stringify(data);
  debug('sending data to trace servers: ', payload);
  req.write(payload);
  req.end();
};

TraceReporter.prototype._getRetryInterval = function() {
  var retryInterval = Math.pow(2, this.retryCount) * this.baseRetryInterval;
  debug('retrying with %d ms', retryInterval);
  return retryInterval;
};

TraceReporter.prototype.getService = function(callback) {

  debug('getting service id from the trace servers');

  var opts = url.parse(COLLECTOR_API_SERVICE);
  var _this = this;

  var req = https.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': package.version
    }
  }, function (res) {

    res.setEncoding('utf8');
    res.pipe(bl(function (err, resBuffer) {
      var response;

      if (err) {
        debug('There was an error when connecting to the Trace API', err);
        return callback(err);
      }

      var resText = resBuffer.toString('utf8');

      debug('raw response from trace servers: ', resText);
      if (res.statusCode > 399) {
        if (++_this.retryCount < _this.retryLimit) {
          return setTimeout(function () {
              _this.getService(callback);
            }, _this._getRetryInterval());
        }
        return callback(new Error('The trace collector-api is currently unavailable'));
      }

      try {
        response = JSON.parse(resText);
      } catch (ex) {
        debug('Error parsing JSON:', ex);
        return callback(ex);
      }

      return callback(null, response);
    }));
  });

  req.write(JSON.stringify({
    name: _this.appName
  }));
  req.end();
};

function create(options) {
  return new TraceReporter(options);
}

module.exports.create = create;
