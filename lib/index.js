var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');

var Collector = require('./collector');
var Shimmer = require('./Shimmer');

var collectorConfig = require('./config');

var seetruAgent;

function getOrphanTraces(config, callback) {
  var files = fs.readdirSync(path.join(__dirname, '../../../'));
  var logFileStartsWith = collectorConfig.logFilePrefix;

  var logFiles = files.filter(function (file) {
    return file.indexOf(logFileStartsWith) > -1;
  });

  logFiles = logFiles.map(function (logFile) {
    return path.join(__dirname, '../../../', logFile);
  });

  return callback(null, logFiles);
}

function getConfig() {
  var config;

  try {
    config = require(path.join(__dirname, '../../../', 'risingtrace.config.js'), 'utf-8');
  } catch (ex) {
    // we have no config file, let's try with ENV variables

    config = {
      appName: process.env.RISINGTRACE_APP_NAME
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

Shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'],
  function (addListener) {
    return function (type, listener) {
      if (type === 'request' && typeof listener === 'function') {
        return addListener.call(this, type,
          require('./wraps/http.Server.prototype.js')(listener,
            collector, config));
      } else {
        return addListener.apply(this, arguments);
      }
    };
  });

Shimmer.wrap(https.Server.prototype, 'https.Server.prototype', ['on', 'addListener'],
  function (addListener) {
    return function (type, listener) {
      if (type === 'request' && typeof listener === 'function') {
        return addListener.call(this, type,
          require('./wraps/http.Server.prototype.js')(listener,
            collector, config));
      } else {
        return addListener.apply(this, arguments);
      }
    };
  });

Shimmer.wrap(http, 'http', 'request', function (original) {
  return require('./wraps/http.request')(original, collector);
});

Shimmer.wrap(https, 'https', 'request', function (original) {
  return require('./wraps/http.request')(original, collector);
});

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
 * @method seetru
 */
function seetru() {

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
    }
  };
}

seetruAgent = seetru();

module.exports = seetruAgent;
