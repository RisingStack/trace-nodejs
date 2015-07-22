var http = require('http');
var url = require('url');
var qs = require('qs');
var COLLECTOR_API_SAMPLE = 'http://comingsoon.trace.risingstack.com/service/sample';
var COLLECTOR_API_SERVICE = 'http://comingsoon.trace.risingstack.com/service';

function TraceReporter (options) {
  this.apiKey = options.apiKey || process.env.TRACE_API_KEY;
  this.appName = options.appName || process.env.TRACE_APP_NAME;

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
      'Authorization': 'Bearer ' + this.apiKey
    }
  }, function () {
    return callback(null);
  })
    .on('error', function (err) {
      return callback(err);
    });

  req.write(qs.stringify(data));
  req.end();
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
      'Authorization': 'Bearer ' + this.apiKey
    }
  }, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      return callback(null, JSON.parse(chunk));
    });
  })
    .on('error', function (err) {
      if (err.status === 409) {
        return _this.getService(callback);
      } else {
        return callback(err);
      }
    });

  req.write(qs.stringify({
    name: _this.appName
  }));
  req.end();
};

function create(options) {
  return new TraceReporter(options);
}

module.exports.create = create;
