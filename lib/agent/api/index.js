'use strict'
var https = require('https')
var url = require('url')
var util = require('util')
var requestSync = require('sync-request')
var isNumber = require('lodash.isnumber')
var debug = require('../../utils/debug')('api')
var format = require('util').format
var assign = require('lodash.assign')
var HttpsProxyAgent = require('https-proxy-agent')
var stringify = require('json-stringify-safe')
var BufferStream = require('./bufferStream')

var bl = require('bl')
var libPackage = require('../../../package')
var zlib = require('zlib')

function CollectorApi (options) {
  this.COLLECTOR_API_SERVICE = url.resolve(options.collectorApiUrl, options.collectorApiServiceEndpoint)
  this.COLLECTOR_API_METRICS = url.resolve(options.collectorApiUrl, options.collectorApiApmMetricsEndpoint)
  this.COLLECTOR_API_RPM_METRICS = url.resolve(options.collectorApiUrl, options.collectorApiRpmMetricsEndpoint)
  this.COLLECTOR_API_INCOMING_EDGE_METRICS = url.resolve(options.collectorApiUrl, options.collectorApiIncomingEdgeMetricsEndpoint)
  this.COLLECTOR_API_EXTERNAL_EDGE_METRICS = url.resolve(options.collectorApiUrl, options.collectorApiExternalEdgeMetricsEndpoint)
  this.COLLECTOR_API_HEALTHCHECK = url.resolve(options.collectorApiUrl, options.collectorApiHealthcheckEndpoint)
  this.COLLECTOR_API_PROFILER_MEMORY_HEAPDUMP = url.resolve(options.collectorApiUrl, options.collectorApiProfilerMemoryHeapdumpEndpoint)
  this.COLLECTOR_API_PROFILER_CPU_PROFILE = url.resolve(options.collectorApiUrl, options.collectorApiProfilerCpuProfileEndpoint)
  this.COLLECTOR_API_CONTROL = url.resolve(options.collectorApiUrl, options.collectorApiControlEndpoint)
  this.COLLECTOR_API_CUSTOM_METRICS = url.resolve(options.collectorApiUrl, options.collectorApiCustomMetrics)
  this.COLLECTOR_API_SECURITY_DEPENDENCIES = url.resolve(options.collectorApiUrl, options.collectorApiSecurityDependenciesEndpoint)

  this.collectorLanguage = options.collectorLanguage
  this.apiKey = options.apiKey
  this.system = options.system
  this.serviceName = options.serviceName
  this.baseRetryInterval = 1000 * 60 * 30 // 30 minutes
  this.serviceKey = null

  if (options.proxy) {
    this.proxyAgent = new HttpsProxyAgent(options.proxy)
  }
}

// USE THIS WITH CAUTION, IT WILL BE BLOCKING
CollectorApi.prototype._sendSync = function (destinationUrl, data, options) {
  try {
    requestSync('POST', destinationUrl, {
      json: data,
      headers: assign({
        'Authorization': 'Bearer ' + this.apiKey,
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version,
        'X-Reporter-Language': this.collectorLanguage
      }, options && options.headers),
      timeout: 1000
    })
  } catch (ex) {
    debug.error('_sendSync', 'Server responded with error: ' + ex)
  }
}

CollectorApi.prototype._withInstanceInfo = function (data) {
  return assign({
    hostname: this.system.hostname,
    pid: this.system.processId
  }, data)
}

CollectorApi.prototype._send = function (destinationUrl, data, callback, options) {
  var opts = url.parse(destinationUrl)
  var payload = stringify(data)

  options = options || { }

  callback = callback || function () {}

  var headers = {
    'Authorization': 'Bearer ' + this.apiKey,
    'Content-Type': 'application/json',
    'X-Reporter-Version': libPackage.version,
    'X-Reporter-Language': this.collectorLanguage
  }

  assign(headers, options.headers)

  if (options.compress) {
    headers['Content-Encoding'] = 'gzip'
    // headers['Content-Type'] = 'application/octet-stream'
  } else {
    headers['Content-Length'] = Buffer.byteLength(payload)
  }

  var requestOptions = {
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    // if the proxy is not set, it will fallback to the default agent
    agent: this.proxyAgent,
    headers: headers
  }

  var req = https.request(requestOptions, function (res) {
    res.setEncoding('utf8')
    res.pipe(bl(function (err, result) {
      if (err) {
        debug.error('_send', err)
        return callback(err)
      }
      callback(null, result)
    }))
  })

  req.on('error', function (error) {
    debug.error('_send', 'Connection error: ' + error)
    callback(error)
  })

  if (options.compress) {
    var stream = new BufferStream(new Buffer(payload))
    stream.pipe(zlib.createGzip()).pipe(req)
  } else {
    req.write(payload)
    req.end()
  }
}

CollectorApi.prototype.sendRpmMetrics = function (data, callback) {
  callback = callback || function () {}
  if (!isNumber(this.serviceKey)) {
    logServiceKeyError('sendRpmMetrics')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_RPM_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo(data), callback)
}

CollectorApi.prototype.ping = function () {
  if (!isNumber(this.serviceKey)) {
    logServiceKeyError('ping')
  }

  var url = util.format(this.COLLECTOR_API_HEALTHCHECK, this.serviceKey)
  this._send(url, this._withInstanceInfo({}))
}

CollectorApi.prototype.sendApmMetrics = function (data, callback) {
  callback = callback || function () {}
  if (!isNumber(this.serviceKey)) {
    logServiceKeyError('sendApmMetrics')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo(data), callback)
}

CollectorApi.prototype.sendMemorySnapshot = function (data, callback) {
  callback = callback || function () {}
  if (!isNumber(this.serviceKey)) {
    logServiceKeyError('sendMemorySnapshot')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_PROFILER_MEMORY_HEAPDUMP, this.serviceKey)
  this._send(url, this._withInstanceInfo(data), callback)
}

CollectorApi.prototype.sendCpuProfile = function (data, callback) {
  callback = callback || function () {}
  if (!isNumber(this.serviceKey)) {
    logServiceKeyError('sendCpuProfile')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_PROFILER_CPU_PROFILE, this.serviceKey)
  this._send(url, this._withInstanceInfo(data), callback)
}

CollectorApi.prototype.sendExternalEdgeMetrics = function (data, callback) {
  callback = callback || function () {}
  if (!isNumber(this.serviceKey)) {
    logServiceKeyError('sendExternalEdgeMetrics')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_EXTERNAL_EDGE_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo(data), callback)
}

CollectorApi.prototype.sendIncomingEdgeMetrics = function (data, callback) {
  callback = callback || function () {}
  if (!isNumber(this.serviceKey)) {
    logServiceKeyError('sendIncomingEdgeMetrics')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_INCOMING_EDGE_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo({
    timestamp: (new Date()).toISOString(),
    data: data
  }), callback)
}

CollectorApi.prototype.getUpdates = function (data, callback) {
  callback = callback || function () {}
  if (!isNumber(this.serviceKey)) {
    logServiceKeyError('getUpdates')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_CONTROL, this.serviceKey)

  this._send(url, this._withInstanceInfo({
    latestCommandId: data.latestCommandId
  }), function (err, response) {
    if (err) {
      return callback(err)
    }

    try {
      callback(null, JSON.parse(response.toString('utf8')))
    } catch (ex) {
      return callback(ex)
    }
  })
}

CollectorApi.prototype.sendCustomMetrics = function (data, callback) {
  callback = callback || function () {}
  if (!isNumber(this.serviceKey)) {
    logServiceKeyError('sendCustomMetrics')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_CUSTOM_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo({
    timestamp: (new Date()).toISOString(),
    data: data
  }), callback)
}

CollectorApi.prototype.sendDependencies = function (dependencies) {
  var url = util.format(this.COLLECTOR_API_SECURITY_DEPENDENCIES, this.serviceKey)
  this._send(url, dependencies)
}

CollectorApi.prototype.getService = function (cb) {
  var opts = url.parse(this.COLLECTOR_API_SERVICE)
  var self = this
  cb = cb || function () {}

  var payload = JSON.stringify({
    name: self.serviceName,
    version: '2',
    collector: {
      language: self.collectorLanguage,
      version: libPackage.version
    },
    runtime: {
      name: self.system.processName,
      version: self.system.processVersion,
      pid: self.system.processId
    },
    machine: {
      arch: self.system.osArch,
      platform: self.system.osPlatform,
      release: self.system.osRelease,
      hostname: self.system.hostname,
      cpus: self.system.cpus
    }
  })
  var req = https.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    agent: this.proxyAgent,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': libPackage.version,
      'X-Reporter-Language': this.collectorLanguage,
      'Content-Length': Buffer.byteLength(payload)
    }
  }, function (res) {
    res.setEncoding('utf8')
    res.pipe(bl(function (err, resBuffer) {
      var response

      var retryInterval = self.baseRetryInterval

      if (err) {
        debug.error('getService', err)
        return setTimeout(function () {
          debug.warn('getService', format('Retrying with %d ms', retryInterval))
          self.getService()
        }, retryInterval)
      }

      var resText = resBuffer.toString('utf8')

      if (res.statusCode === 401) {
        debug.error('getService', 'Api key rejected')
        return
      }
      if (res.statusCode > 399) {
        debug.error('getService', 'Service responded with ' + res.statusCode)
        return setTimeout(function () {
          debug.warn('getService', format('Retrying with %d ms', retryInterval))
          self.getService(cb)
        }, retryInterval)
      }

      try {
        response = JSON.parse(resText)
      } catch (ex) {
        return
      }

      self.serviceKey = response.key
      cb(null, response.key)
    }))
  })

  req.on('error', function (error) {
    debug.error('getService', error)
  })
  req.write(payload)
  req.end()
}

function logServiceKeyError (method) {
  debug.error(method, 'Service key not present, cannot send')
}

function create (options) {
  return new CollectorApi(options)
}

module.exports.create = create
