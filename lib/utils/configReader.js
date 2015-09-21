'use strict';

var path = require('path');

var extend = require('lodash/object/extend');
var defaults = require('lodash/object/defaults');

var allowedReporters = ['logstash', 'trace'];

function isReporterValid (reporterType) {
  var index = allowedReporters
    .indexOf(reporterType);

  return index > -1;
}

function ConfigReader (collectorConfig) {
  this.collectorConfig = collectorConfig;
}

ConfigReader.prototype._require = function (filePath) {
  return require(filePath);
};

ConfigReader.prototype._initConfig = function () {
  var config;
  try {
    var configPath = this.collectorConfig.configPath ||
      path.join(__dirname, '../../../../../', 'trace.config.js');
    var configToExtend = this._require(configPath);
    config = extend({}, configToExtend);
  } catch (ex) {
    throw new Error('Invalid trace.config.js configuration file');
  }

  return config;
};

ConfigReader.prototype._getReporterConfig = function () {
  var reporterConfig;

  if (!isReporterValid(this.collectorConfig.reporterType)) {
    throw new Error('Invalid reporter type');
  }

  if (!this.collectorConfig.reporterConfig) {
    throw new Error('No reporter config');
  }

  try {
    reporterConfig = JSON.parse(this.collectorConfig.reporterConfig);
  } catch (ex) {
    throw new Error('Invalid reporter config JSON');
  }

  return reporterConfig;
};

ConfigReader.prototype.getConfig = function () {
  var config = this._initConfig();
  var reporterConfig;

  if (!config.reporter) {
    reporterConfig = this._getReporterConfig();
    reporterConfig.appName = config.appName;
    config.reporter = this._require('../reporters')[this.collectorConfig.reporterType]
      .create(reporterConfig);
  } else {
    config.reporter.appName = config.appName;
  }

  var resultConfig = defaults({}, this.collectorConfig, config);

  if (!resultConfig.appName) {
    throw new Error('Missing appName');
  }

  return resultConfig;
};

module.exports.create = function (config) {
  config = config || require('../config');

  return new ConfigReader(config);
};

