var fs = require('fs');
var path = require('path');

var session = require('continuation-local-storage').createNamespace('trace');

var collectorConfig = require('./config');
var Collector = require('./collector');
var getConfig = require('./utils/configReader').getConfig;
var wraps = require('./wraps');

var traceAgent;

function getOrphanTraces(config, callback) {
  var files = fs.readdirSync(collectorConfig.logFilePath);
  var logFileStartsWith = collectorConfig.logFilePrefix;

  var logFiles = files.filter(function (file) {
    return file.indexOf(logFileStartsWith) > -1;
  });

  logFiles = logFiles.map(function (logFile) {
    return path.join(collectorConfig.logFilePath, logFile);
  });

  return callback(null, logFiles);
}

var config = getConfig();

var collector = new Collector(config);

wraps.instrument(collector);

function setService(config, callback) {
  var reporter = config.reporter;

  if (!reporter.getService) {
    return callback(null, {
      key: config.appName
    });
  }

  reporter.getService(callback);
}

/*
 * @method trace
 */
function trace() {

  setService(config, function (err, service) {
    if (err) {
      return console.log(err);
    }

    collector.setService(service.key);
    collector.startCollecting();
  });

  getOrphanTraces(config, function (err, traces) {
    if (err) {
      return console.log(err);
    }

    traces.forEach(function (trace) {
      collector._send(trace);
    });
  });

  return {
    report: function (data) {
      collector.report(data);
    },
    getTransactionId: function () {
      return session.get('request-id');
    }
  };
}

traceAgent = trace();

module.exports = traceAgent;
