var http = require('http');
var fs = require('fs');
var path = require('path');
var superagent = require('superagent');

var Collector = require('./collector');
var Shimmer = require('./Shimmer');

var collectorConfig = require('./config');

var seetruAgent;

function getOrphanTraces(config, callback) {
  var files = fs.readdirSync(path.join(__dirname, '../../../../'));
  var logFileStartsWith = 'seetru_trace_' + config.service;

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
    config = require(path.join(__dirname, '../../../', 'risingtrace.config.js'), 'utf-8');
  } catch (ex) {
    // we have no config file, let's try with ENV variables

    config = {
      appName: process.env.RISINGTRACE_APP_NAME,
      apiKey: process.env.RISINGTRACE_API_KEY
    };

  }

  config.collectInterval = collectorConfig.collectInterval;
  config.sampleSize = collectorConfig.sampleSize;

  //check if everything is ok with config
  if (!config.appName) {
    throw new Error('Missing appName');
  }

  if (!config.apiKey) {
    throw new Error('Missing apiKey');
  }

  return config;
}

function getService(config, callback) {
  superagent
    .post(collectorConfig.collectorApi)
    .set('Authorization', 'Bearer ' + config.apiKey)
    .send({
      name: config.appName
    })
    .end(function (err, res) {
      if (err && err.status === 409) {
        return getService(config, callback);
      } else if (err) {
        return callback(err);
      }

      return callback(null, res.body);
    });
}

var config = getConfig();
var collector = new Collector(config);
collector.startCollecting();

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

Shimmer.wrap(http, 'http', 'request', function (original) {
  return require('./wraps/http.request')(original, collector, config);
});

/*
 * @method seetru
 */
function seetru() {

  getService(config, function (err, service) {
    if (err) {
      return console.log(err);
    }


    collector.setService(service.key);
  });

  getOrphanTraces(config, function (err, traces) {
    if (err) {
      return console.log(err);
    }

  });

  return {
    report: function (data) {
      collector.report(data);
    }
  };
}

seetruAgent = seetru();

module.exports = seetruAgent;
