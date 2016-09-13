var https = require('https')
var url = require('url')
var util = require('util')
var requestSync = require('sync-request')
var isNumber = require('lodash.isnumber')
var debug = require('debug')('risingstack/trace:agent:api')
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
  debug('#_sendSync', 'Sending data to ' + destinationUrl)
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
    debug('#_sendSync', '[Error] Server responded with error', ex)
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
        debug('#_send', '[Error]', err)
        return
      }
      callback(null, result)
    }))
  })

  debug('#_send', 'Sending data to ', destinationUrl)

  req.on('error', function (error) {
    console.error('error: [trace]', 'There was an error connecting to the Trace servers when sending data. Make sure your servers can reach', opts.hostname)
    debug('#_send', '[Error] Connection error', error)
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

CollectorApi.prototype.sendRpmMetrics = function (data) {
  if (!isNumber(this.serviceKey)) {
    debug('#sendRpmMetrics', '[Error] Service key not present, cannot send rpm metrics')
    return
  }

  var url = util.format(this.COLLECTOR_API_RPM_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo(data))
}

CollectorApi.prototype.ping = function () {
  if (!isNumber(this.serviceKey)) {
    debug('#ping', '[Error] Service key not present, cannot do healthcheck')
    return
  }

  var url = util.format(this.COLLECTOR_API_HEALTHCHECK, this.serviceKey)
  this._send(url, this._withInstanceInfo({}))
}

CollectorApi.prototype.sendApmMetrics = function (data) {
  if (!isNumber(this.serviceKey)) {
    debug('#sendApmMetrics', '[Error] Service key not present, cannot send metrics')
    return
  }

  var url = util.format(this.COLLECTOR_API_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo(data))
}

CollectorApi.prototype.sendMemorySnapshot = function (data, callback) {
  if (!isNumber(this.serviceKey)) {
    debug('#sendMemorySnapshot', '[Error] Service key not present, cannot send heapdump')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_PROFILER_MEMORY_HEAPDUMP, this.serviceKey)
  this._send(url, this._withInstanceInfo(data), callback)
}

CollectorApi.prototype.sendCpuProfile = function (data, callback) {
  if (!isNumber(this.serviceKey)) {
    debug('#sendCpuProfile', '[Error] Service key not present, cannot send cpu profile')
    return callback(new Error('serviceKey is missing'))
  }

  var url = util.format(this.COLLECTOR_API_PROFILER_CPU_PROFILE, this.serviceKey)
  this._send(url, this._withInstanceInfo(data), callback)
}

CollectorApi.prototype.sendExternalEdgeMetrics = function (data) {
  if (!isNumber(this.serviceKey)) {
    debug('#sendExternalEdgeMetrics', '[Error] Service key not present, cannot send metrics')
    return
  }

  var url = util.format(this.COLLECTOR_API_EXTERNAL_EDGE_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo(data))
}

CollectorApi.prototype.sendIncomingEdgeMetrics = function (data) {
  if (!isNumber(this.serviceKey)) {
    debug('#sendIncomingEdgeMetrics', '[Error] Service key not present, cannot send metrics')
    return
  }

  var url = util.format(this.COLLECTOR_API_INCOMING_EDGE_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo({
    timestamp: (new Date()).toISOString(),
    data: data
  }))
}

CollectorApi.prototype.getUpdates = function (data, callback) {
  if (!isNumber(this.serviceKey)) {
    debug('#getUpdates', '[Error] Service key not present, cannot get updates')
    return
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

CollectorApi.prototype.sendCustomMetrics = function (data) {
  if (!isNumber(this.serviceKey)) {
    debug('#sendCustomMetrics', '[Error] Service key not present, cannot send metrics')
    return
  }

  var url = util.format(this.COLLECTOR_API_CUSTOM_METRICS, this.serviceKey)
  this._send(url, this._withInstanceInfo({
    timestamp: (new Date()).toISOString(),
    data: data
  }))
}

CollectorApi.prototype.sendDependencies = function (dependencies) {
  var url = util.format(this.COLLECTOR_API_SECURITY_DEPENDENCIES, this.serviceKey)
  this._send(url, dependencies)
}

CollectorApi.prototype.getService = function (cb) {
  var opts = url.parse(this.COLLECTOR_API_SERVICE)
  var _this = this
  cb = cb || function () {}

  var payload = JSON.stringify({
    name: _this.serviceName,
    version: '2',
    collector: {
      language: _this.collectorLanguage,
      version: libPackage.version
    },
    runtime: {
      name: _this.system.processName,
      version: _this.system.processVersion,
      pid: _this.system.processId
    },
    machine: {
      arch: _this.system.osArch,
      platform: _this.system.osPlatform,
      release: _this.system.osRelease,
      hostname: _this.system.hostname,
      cpus: _this.system.cpus
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

      var retryInterval = _this.baseRetryInterval

      if (err) {
        debug('#getService', '[Error]', err)
        return setTimeout(function () {
          debug('#getService', 'Retrying with %d ms', retryInterval)
          _this.getService()
        }, retryInterval)
      }

      var resText = resBuffer.toString('utf8')

      if (res.statusCode === 401) {
        debug('#getService', '[Error] Api key rejected')
        return console.error('error: [trace]', 'Trace API key is rejected - are you sure you are using the right one?')
      }
      if (res.statusCode > 399) {
        debug('#getService', '[Error] Service responded with', res.statusCode)
        return setTimeout(function () {
          debug('#getService', 'Retrying with %d ms', retryInterval)
          _this.getService(cb)
        }, retryInterval)
      }

      try {
        response = JSON.parse(resText)
      } catch (ex) {
        return
      }

      _this.serviceKey = response.key
      cb(null, response.key)
    }))
  })

  debug('#getService', 'Sending request')

  req.on('error', function (error) {
    console.error('error: [trace]', 'There was an error connecting to the Trace servers to get the service key. Make sure your servers can reach', opts.hostname)
    debug('#getService', '[Error] error', error)
  })
  req.write(payload)
  req.end()
}

function create (options) {
  return new CollectorApi(options)
}

module.exports.create = create
