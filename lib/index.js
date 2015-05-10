var http = require('http');
var fs = require('fs');
var path = require('path');
var superagent = require('superagent');

var Collector = require('./collector');
var Shimmer = require('./Shimmer');

var COLLECT_INTERVAL = 60 * 1000;
var SAMPLE_SIZE = 60;
var COLLECTOR_API = 'http://seetru-collector-staging.herokuapp.com:80/service';

var seetruAgent;


function getOrphanTraces (config, callback) {
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

function getConfig (callback) {
  var configFile;

  try {
    configFile = require(path.join(__dirname, '../../../', 'risingtrace.config.js'), 'utf-8');
  } catch (ex) {
    // we have no config file, let's try with ENV variables

    configFile = {
      appName: process.env.RISINGTRACE_APP_NAME,
      apiKey: process.env.RISINGTRACE_API_KEY
    };

  }

  //check if everything is ok with config
  if (!configFile.appName) {
    return callback(new Error('Missing appName'));
  }

  if (!configFile.apiKey) {
    return  callback(new Error('Missing apiKey'));
  }

  return callback(null, configFile);
}

function getService (config, callback) {
  superagent
    .post(COLLECTOR_API)
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

/*
 * @method seetru
 */
function seetru() {

  var c = {
    report: function () {},
    emit: function () {}
  };

  getConfig(function (err, config) {
    if (err) {
      return console.log(err);
    }

    config.collectInterval = COLLECT_INTERVAL;
    config.sampleSize = SAMPLE_SIZE;

    getService(config, function (err, service) {
      if (err) {
        return console.log(err);
      }

      config.service = service.key;

      getOrphanTraces(config, function (err, traces) {
        if (err) {
          return console.log(err);
        }

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

        Shimmer.wrap(http, 'http', 'request', function (original) {
          return require('./wraps/http.request')(original, collector, config);
        });

        collector.startCollecting();
      });
    })
  });

  return {
    report: function (data) {
      c.report(data);
    }
  };
}

seetruAgent = seetru();

module.exports = seetruAgent;
