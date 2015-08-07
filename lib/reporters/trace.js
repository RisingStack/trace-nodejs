var http = require('http');
var url = require('url');

var config = require('../config');

var COLLECTOR_API_SAMPLE = config.collectorApi + config.collectorApiSampleEndpoint;
var COLLECTOR_API_SERVICE = config.collectorApi + config.collectorApiServiceEndpoint;

function TraceReporter (options) {
  this.apiKey = options.apiKey || process.env.TRACE_API_KEY;
  this.appName = options.appName || process.env.TRACE_APP_NAME;
  this.baseRetryInterval = 100;
  this.retryLimit = 5;
  this.retryCount = 0;

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

  var req = http.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json'
    }
  }, function () {
    return callback(null);
  })
    .on('error', function (err) {
      return callback(err);
    });

  req.write(JSON.stringify(data));
  req.end();
};

TraceReporter.prototype._getRetryInterval = function() {
  return Math.pow(2, this.retryCount) * this.baseRetryInterval;
};

TraceReporter.prototype.getService = function(callback) {

  var opts = url.parse(COLLECTOR_API_SERVICE);
  var _this = this;

  var req = http.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json'
    }
  }, function (res) {
    var resChunk;
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      try {
        resChunk = JSON.parse(chunk);
      } catch (ex) {
        return callback(ex);
      }
      if (res.statusCode === 409) {
        if (++_this.retryCount < _this.retryLimit) {
          return setTimeout(_this.getService(callback),
            _this._getRetryInterval());
        }
        return callback(new Error('The trace collector-api is currently unavailable'));
      }
      return callback(null, resChunk);
    });
  })
    .on('error', callback);

  req.write(JSON.stringify({
    name: _this.appName
  }));
  req.end();
};

function create(options) {
  return new TraceReporter(options);
}

module.exports.create = create;
