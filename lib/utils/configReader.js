'use strict'

var path = require('path')
var warn = require('debug')('risingstack/trace:warn')
var defaults = require('lodash/object/defaults')

function ConfigReader (config) {
  this.parameterConfig = config || { }
}

ConfigReader.prototype._getEnvVarConfig = function () {
  return {
    collectInterval: process.env.TRACE_COLLECT_INTERVAL,
    initialSampleRate: process.env.TRACE_INITIAL_SAMPLE_RATE,
    collectorApi: process.env.TRACE_COLLECTOR_API_URL,
    appName: process.env.TRACE_APP_NAME,
    configPath: process.env.TRACE_CONFIG_PATH,
    apiKey: process.env.TRACE_API_KEY
  }
}

ConfigReader.prototype._getDefaultConfig = function () {
  return require('../config')
}

ConfigReader.prototype._readConfigFile = function (file) {
  return require(file)
}

ConfigReader.prototype._getFileConfig = function (file) {
  if (file) {
    try {
      return this._readConfigFile(path.resolve(file))
    } catch (ex) {
      if (ex.code === 'MODULE_NOT_FOUND') {
        warn('Configuration file not found')
        return { }
      } else {
        throw new Error('Invalid trace.config.js configuration file')
      }
    }
  } else /* no file path given */ {
    return { }
  }
}

ConfigReader.prototype._getReporterConfig = function (reporterArgs) {
  return require('../reporters').trace.create(reporterArgs)
}

ConfigReader.prototype.getConfig = function () {
  var parameterConfig = this.parameterConfig
  var envVarConfig = this._getEnvVarConfig()
  var defaultConfig = this._getDefaultConfig()

  var config = {}

  defaults(config, parameterConfig, envVarConfig)

  var configFilePath = parameterConfig.configPath || envVarConfig.configPath || defaultConfig.configPath

  var fileConfig = this._getFileConfig(configFilePath)

  defaults(
    config,
    fileConfig,
    defaultConfig
  )

  if (!config.appName) {
    throw new Error('Missing appName')
  }

  if (!config.reporter) {
    config.reporter = this._getReporterConfig({
      appName: config.appName,
      apiKey: config.apiKey
    })
  }

  return config
}

module.exports.create = function (config) {
  return new ConfigReader(config)
}
