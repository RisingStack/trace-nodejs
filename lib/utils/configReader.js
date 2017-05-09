'use strict'
var path = require('path')
var os = require('os')
var url = require('url')
var debug = require('./debug')('config')
var defaults = require('lodash.defaults')
var format = require('util').format
var fs = require('fs')

function ConfigReader (config) {
  this.parameterConfig = config || { }
}

ConfigReader.prototype._getSystemConfig = function () {
  return {
    system: {
      osArch: process.arch,
      osPlatform: process.platform,
      osRelease: os.release(),
      hostname: os.hostname(),
      cpus: os.cpus().map(function (cpu) {
        delete cpu.times
        return cpu
      }),
      processName: process.title,
      processId: process.pid,
      processVersion: process.version
    }
  }
}

ConfigReader.prototype._getCloudFoundryConfig = function () {
  var VCAP_APPLICATION = process.env.VCAP_APPLICATION
  var VCAP_SERVICES = process.env.VCAP_SERVICES
  var apiKey

  try {
    VCAP_APPLICATION = JSON.parse(VCAP_APPLICATION)
    VCAP_SERVICES = JSON.parse(VCAP_SERVICES)
    apiKey = VCAP_SERVICES.trace[0].credentials.TRACE_API_KEY
  } catch (ex) {
    return {}
  }

  return {
    serviceName: VCAP_APPLICATION.name,
    apiKey: apiKey
  }
}

ConfigReader.prototype._getEnvVarConfig = function () {
  var envVarConfig = {
    collectInterval: process.env.TRACE_COLLECT_INTERVAL,
    updateInterval: process.env.TRACE_UPDATE_INTERVAL,
    initialSampleRate: process.env.TRACE_INITIAL_SAMPLE_RATE,
    collectorApiUrl: process.env.TRACE_COLLECTOR_API_URL,
    collectorLanguage: process.env.TRACE_COLLECTOR_LANGUAGE,
    serviceName: process.env.TRACE_SERVICE_NAME,
    configPath: process.env.TRACE_CONFIG_PATH,
    apiKey: process.env.TRACE_API_KEY,
    disableStackTrace: process.env.TRACE_DISABLE_STACK_TRACE == true, // eslint-disable-line
    disableInstrumentations: process.env.TRACE_DISABLE_INSTRUMENTATIONS
      ? process.env.TRACE_DISABLE_INSTRUMENTATIONS.split(',')
      : undefined,
    proxy: process.env.TRACE_PROXY || process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY,
    keepQueryParams: process.env.TRACE_KEEP_QUERY_PARAMS,
    collectSeverity: process.env.TRACE_COLLECT_SEVERITY,
    profilerWindowLength: process.env.TRACE_PROFILER_WINDOW_LENGTH
      ? parseInt(process.env.TRACE_PROFILER_WINDOW_LENGTH)
      : 10000
  }

  if (process.env.TRACE_SAMPLER_LIMIT) {
    var samplerLimit = Number(process.env.TRACE_SAMPLER_LIMIT)
    !isNaN(samplerLimit) && defaults(envVarConfig, { samplerLimit: samplerLimit })
  }

  var ignoreHeaders
  var ignoreOutgoingHosts

  if (process.env.TRACE_IGNORE_HEADERS) {
    try {
      ignoreHeaders = JSON.parse(process.env.TRACE_IGNORE_HEADERS)
      defaults(envVarConfig, { ignoreHeaders: ignoreHeaders })
    } catch (err) {
      debug.error('getEnvVarConfig',
        format('[Error] Cannot parse TRACE_IGNORE_HEADERS. %s', err.stack))
    }
  }

  if (process.env.TRACE_IGNORE_OUTGOING_HOSTS) {
    try {
      ignoreOutgoingHosts = JSON.parse(process.env.TRACE_IGNORE_OUTGOING_HOSTS)
      defaults(envVarConfig, { ignoreOutgoingHosts: ignoreOutgoingHosts })
    } catch (err) {
      debug.error('getEnvVarConfig',
        format('Cannot parse TRACE_IGNORE_OUTGOING_HOSTS. %s', err.stack))
    }
  }

  return envVarConfig
}

ConfigReader.prototype._getDefaultConfig = function () {
  return require('../config')
}

ConfigReader.prototype._readConfigFile = function (file) {
  return require(file)
}

ConfigReader.prototype._isConfigFileExists = function (file) {
  var failCounter = 0
  try {
    fs.statSync(path.resolve(file + '.js'))
  } catch (ex) {
    failCounter += 1
  }

  try {
    fs.statSync(path.resolve(file))
  } catch (ex) {
    failCounter += 1
  }

  if (failCounter < 2) {
    return true
  } else {
    debug.info('_isConfigFileExists',
      'Configuration file not found')
    return false
  }
}

ConfigReader.prototype._getFileConfig = function (file) {
  if (file && this._isConfigFileExists(file)) {
    try {
      return this._readConfigFile(path.resolve(file))
    } catch (ex) {
      throw new Error('Invalid trace.config.js configuration file')
    }
  } else /* no file path given */ {
    return { }
  }
}

ConfigReader.prototype._getVmConfig = function (name) {
  var vmConfig = {}
  var cGroupContent = this._readProcFile('/self/cgroup')
  var isRunningInVm

  if (cGroupContent) {
    isRunningInVm = this.isRunningInVm(cGroupContent)
  }

  vmConfig.isRunningInVm = isRunningInVm

  return vmConfig
}

ConfigReader.prototype.isRunningInVm = function (cGroupFile) {
  var cGroupLines = cGroupFile.split('\n')
  var patterns = [
    /^\/docker/,
    /^\/lxc/
  ]
  var parts
  var i
  var j
  for (i = 0; i < cGroupLines.length; i++) {
    parts = cGroupLines[i].split(':')
    if (parts.length !== 3) {
      continue
    }
    for (j = 0; j < patterns.length; j++) {
      if (parts[2].match(patterns[i])) {
        return true
      }
    }
  }
  return false
}

ConfigReader.prototype._readProcFile = function (name) {
  var procFileContent
  try {
    procFileContent = fs.readFileSync('/proc' + name, 'utf-8')
  } catch (err) {
    debug.info('_readProcFile',
      format('Cannot read procfile %s: %s', name, err))
  }
  return procFileContent
}

ConfigReader.prototype._checkApiToken = function (token) {
  var bearerTokenParts

  if (!token) {
    throw new Error('API Key not set. For more information check the docs: https://trace-docs.risingstack.com/docs/troubleshooting')
  }

  bearerTokenParts = token.split('.')

  if (bearerTokenParts.length !== 3) {
    throw new Error('API Key invalid. For more information check the docs: https://trace-docs.risingstack.com/docs/troubleshooting')
  }
}

ConfigReader.prototype._normalizeConfig = function () {
  this.config.apiKey = this.config.apiKey.trim()
  this.config.serviceName = this.config.serviceName.trim()
}

ConfigReader.prototype.getConfig = function () {
  var parameterConfig = this.parameterConfig
  var systemConfig = this._getSystemConfig()
  var envVarConfig = this._getEnvVarConfig()
  var defaultConfig = this._getDefaultConfig()
  var cloudFoundryConfig = this._getCloudFoundryConfig()

  var config = defaults({}, parameterConfig, systemConfig, envVarConfig)

  var configFilePath = parameterConfig.configPath || envVarConfig.configPath || defaultConfig.configPath

  var fileConfig = this._getFileConfig(configFilePath)

  var vmConfig = this._getVmConfig()

  this.config = config = defaults(
    config,
    fileConfig,
    cloudFoundryConfig,
    vmConfig,
    defaultConfig
  )

  config.whiteListHosts = [
    url.parse(config.collectorApiUrl).host
  ].concat(config.ignoreOutgoingHosts || [])

  this._checkApiToken(config.apiKey)

  if (!config.serviceName) {
    throw new Error('Service name missing. For more information check the docs: https://trace-docs.risingstack.com/docs/troubleshooting')
  }

  this._normalizeConfig()

  return config
}

module.exports = ConfigReader

module.exports.create = function (config) {
  return new ConfigReader(config)
}
