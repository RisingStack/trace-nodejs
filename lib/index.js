var fs = require('fs');
var path = require('path');

var session = require('continuation-local-storage').createNamespace('trace');

var collectorConfig = require('./config');
var Collector = require('./collector');

var traceAgent;

var wraps = require('./wraps');

function getOrphanTraces(config, callback) {
  var files = fs.readdirSync(path.join(__dirname, '../../../../'));
  var logFileStartsWith = collectorConfig.logFilePrefix;

  var logFiles = files.filter(function (file) {
    return file.indexOf(logFileStartsWith) > -1;
  });

  logFiles = logFiles.map(function (logFile) {
    return path.join(__dirname, '../../../../', logFile);
  });

  return callback(null, logFiles);
}

function getConfig() {
  var config;

  try {
    config = require(path.join(__dirname, '../../../../', 'trace.config.js'), 'utf-8');
  } catch (ex) {
    // we have no config file, let's try with ENV variables

    config = {
      appName: process.env.TRACE_APP_NAME
    };

  }

  config.collectInterval = collectorConfig.collectInterval;
  config.sampleSize = collectorConfig.sampleSize;

  //check if everything is ok with config
  if (!config.appName) {
    throw new Error('Missing appName');
  }

  if (!config.reporter) {
    console.warn('Missing reporter, we cannot send the report :(');
    config.reporter = {
      send: function () {
      }
    };
  }

  return config;
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
