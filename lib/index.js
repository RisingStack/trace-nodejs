var http = require('http');
var fs = require('fs');

var Collector = require('./collector');
var Shimmer = require('./Shimmer');

var COLLECT_INTERVAL = 3000 * 1000;
var SAMPLE_SIZE = 60;

/*
 * @method seetru
 */
function bootstrap(collector, options) {
  var files = fs.readdirSync('./');
  var logFileStartsWith = 'seetru_trace_' + options.service;

  var logFiles = files.filter(function (file) {
    return file.indexOf(logFileStartsWith) > -1;
  });

  logFiles = logFiles.map(function (logFile) {
    return './' + logFile;
  });

  logFiles.forEach(function (logFile) {
    collector._send(logFile);
  });
}

/*
 * @method seetru
 */
function seetru(options) {

  options.collectInterval = COLLECT_INTERVAL;
  options.sampleSize = SAMPLE_SIZE;

  var collector = new Collector(options);

  bootstrap(collector, options);

  collector.startCollecting();

  Shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./wraps/http.Server.prototype.js')(listener,
              collector, options));
        } else {
          return addListener.apply(this, arguments);
        }
      };
    });

  Shimmer.wrap(http, 'http', 'request', function (original) {
    return require('./wraps/http.request')(original, collector, options);
  });

  return {
    report: function (data) {
      collector.report(data);
    }
  };
}

module.exports = seetru;
