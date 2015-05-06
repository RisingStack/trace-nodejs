var http = require('http');
var fs = require('fs');
var path = require('path');

var Collector = require('./collector');
var Shimmer = require('./Shimmer');

var COLLECT_INTERVAL = 60 * 1000;
var SAMPLE_SIZE = 60;

var seetruAgent;

/*
 * @method bootstrap
 */
function bootstrap(collector, options) {
  var files = fs.readdirSync(path.join(__dirname, '../../../../'));
  var logFileStartsWith = 'seetru_trace_' + options.service;

  var logFiles = files.filter(function (file) {
    return file.indexOf(logFileStartsWith) > -1;
  });

  logFiles = logFiles.map(function (logFile) {
    return path.join(__dirname, '../../../../', logFile);
  });

  logFiles.forEach(function (logFile) {
    collector._send(logFile);
  });
}

function getConfig () {
  var configFile;

  try {
    configFile = require(path.join(__dirname, '../../../', 'risingtrace.config.js'), 'utf-8');
  } catch (ex) {
    // we have no config file, let's try with ENV variables

    configFile = {
      appName: process.env.RISINGTRACE_APP_NAME,
      licenceKey: process.env.RISINGTRACE_LICENCE_KEY
    };

  }

  //check if everything is ok with config

  if (!configFile.appName) {
    throw new Error('Missing appName');
  }

  if (!configFile.licenceKey) {
    throw new Error('Missing licenceKey');
  }

  return configFile;
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

seetruAgent = seetru(getConfig());

module.exports = seetruAgent;
