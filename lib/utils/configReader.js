var path = require('path');

var _ = require('lodash');

var collectorConfig = require('../config');

function getConfig() {
  var config = {};

  try {
    var configToExtend = require(path.join(__dirname, '../../../../', 'trace.config.js'), 'utf-8');
    config = _.extend({}, configToExtend);
  } catch (ex) {
  }

  // we have no config file, let's try with ENV variables
  var reporterType = process.env.TRACE_REPORTER_TYPE;
  var reporterConfigString = process.env.TRACE_REPORTER_CONFIG;
  var reporterConfig;
  if (reporterConfigString) {
    try {
      reporterConfig = JSON.parse(reporterConfigString);
    } catch (parseError) {
      console.warn('Malformed reporter config JSON');
    }
  }

  var index = ['logstash', 'trace'].indexOf(reporterType);
  if (reporterType && reporterConfig && index !== -1) {
    var reporterToExtend = require('../reporters')[reporterType].create(reporterConfig);
    config.reporter = _.extend({}, reporterToExtend);
  }

  config.appName = process.env.TRACE_APP_NAME || config.appName;

  config.collectInterval = collectorConfig.collectInterval;
  config.sampleSize = collectorConfig.sampleSize;

  //check if everything is ok with config
  if (!config.appName) {
    throw new Error('Missing appName');
  }

  if (!config.reporter) {
    throw new Error('Missing reporter, we cannot send the report');
  }

  return config;
}

module.exports.getConfig = getConfig;
