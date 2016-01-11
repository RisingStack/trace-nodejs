'use strict'

var path = require('path')

var extend = require('lodash/object/extend')
var defaults = require('lodash/object/defaults')

var allowedReporters = ['logstash', 'trace']

function isReporterValid (reporterType) {
  var index = allowedReporters
    .indexOf(reporterType)

  return index > -1
}

function ConfigReader (config) {
  this.config = config
}

ConfigReader.prototype._require = function (filePath) {
  return require(filePath)
}

ConfigReader.prototype._getEnvVarConfig = function() {
  return {
    collectInterval: process.env.TRACE_COLLECT_INTERVAL,
    initialSampleRate: process.env.TRACE_INITIAL_SAMPLE_RATE,
    collectorApi: process.env.TRACE_COLLECTOR_API_URL,
    appName: process.env.TRACE_APP_NAME,
    configPath: process.env.TRACE_CONFIG_PATH,
    apiKey: process.env.TRACE_API_KEY
  }
}

ConfigReader.prototype._getDefaultConfig = function() {
  return this.config()
}


ConfigReader.prototype._getFileConfig = function (file) {
  var config
  try {
    var configToExtend = this._require(path.resolve(file))
    config = extend({}, configToExtend)
  } catch (ex) {
    throw new Error('Invalid trace.config.js configuration file')
  }
  return config
}

ConfigReader.prototype._getReporterConfig = function (reporterArgs) {
  return {
    reporter: this._require('../reporters').trace.create(reporterArgs)
  }
}

ConfigReader.prototype.getConfig = function () {

  var envVarConfig = this._getEnvVarConfig()
  var defaultConfig = this._getDefaultConfig()

  var configFilePath = envVarConfig.configPath || defaultConfig.configPath

  var fileConfig = configFilePath  ? this._getFileConfig(configFilePath) : {}

  var partialConfig = defaults({},
    envVarConfig,
    fileConfig,
    defaultConfig
  )

  if(!partialConfig.apiKey) {
    throw new Error('Missing appName')
  }

  var reporterConfig = this._getReporterConfig({
    appName: partialConfig.appName
    apiKey: partialConfig.apiKey
  })

  return defaults({},
    reporterConfig,
    partialConfig)

}


module.exports.create = function (config) {
  config = config || require('../config')

  return new ConfigReader(config)
}
