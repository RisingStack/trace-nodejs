var https = require('https')
var url = require('url')
var util = require('util')
var requestSync = require('sync-request')
var isNumber = require('lodash.isnumber')
var debug = require('debug')('risingstack/trace')
var format = require('util').format
var assign = require('lodash.assign')

var bl = require('bl')
var libPackage = require('../../../package')

function CollectorApi (options) {
  this.COLLECTOR_API_SAMPLE = url.resolve(options.collectorApiUrl, options.collectorApiSampleEndpoint)
  this.COLLECTOR_API_SERVICE = url.resolve(options.collectorApiUrl, options.collectorApiServiceEndpoint)
  this.COLLECTOR_API_METRICS = url.resolve(options.collectorApiUrl, options.collectorApiApmMetricsEndpoint)
  this.COLLECTOR_API_RPM_METRICS = url.resolve(options.collectorApiUrl, options.collectorApiRpmMetricsEndpoint)

  this.apiKey = options.apiKey
  this.processId = options.processId
  this.hostname = options.hostname
  this.serviceName = options.serviceName
  this.baseRetryInterval = 1000 * 60 * 30 // 30 minutes
  this.serviceKey = null
}

// USE THIS WITH CAUTION, IT WILL BE BLOCKING
CollectorApi.prototype.sendSync = function (data) {
  debug('sending data to trace servers sync: ', JSON.stringify(data))
  requestSync('POST', this.COLLECTOR_API_SAMPLE, {
    json: data,
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': libPackage.version
    },
    timeout: 1000
  })
}

CollectorApi.prototype._send = function (destinationUrl, data) {
  var opts = url.parse(destinationUrl)
  var payload = JSON.stringify(data)

  var req = https.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': libPackage.version,
      'Content-Length': payload.length
    }
  }, function (res) {
    res.setEncoding('utf8')
    res.pipe(bl(function (err) {
      if (err) {
        debug('There was an error when connecting to the Trace API', err)
        return
      }

      debug('HTTP Traces sent successfully')
    }))
  })

  debug('sending data to trace servers: ', payload)
  req.write(payload)
  req.end()
}

CollectorApi.prototype.sendRpmMetrics = function (data) {
  if (!isNumber(this.serviceKey)) {
    debug('Service id not present, cannot send rpm metrics')
    return
  }

  var url = util.format(this.COLLECTOR_API_RPM_METRICS, this.serviceKey)
  this._send(url, assign({ hostname: this.hostname, pid: this.processId }, data))
}

CollectorApi.prototype.sendApmMetrics = function (data) {
  if (!isNumber(this.serviceKey)) {
    debug('Service id not present, cannot send metrics')
    return
  }

  var url = util.format(this.COLLECTOR_API_METRICS, this.serviceKey)
  this._send(url, assign({ hostname: this.hostname, pid: this.processId }, data))
}

CollectorApi.prototype.sendSamples = function (data) {
  var url = this.COLLECTOR_API_SAMPLE
  this._send(url, assign({ hostname: this.hostname, pid: this.processId }, data))
}

CollectorApi.prototype._getRetryInterval = function () {
  debug('retrying with %d ms', this.baseRetryInterval)
  return this.baseRetryInterval
}

CollectorApi.prototype.getService = function (cb) {
  debug('getting service id from the trace servers')

  var opts = url.parse(this.COLLECTOR_API_SERVICE)
  var _this = this
  cb = cb || function () {}

  var payload = JSON.stringify({
    name: _this.serviceName
  })
  var req = https.request({
    hostname: opts.hostname,
    port: opts.port,
    path: opts.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
      'X-Reporter-Version': libPackage.version,
      'Content-Length': payload.length
    }
  }, function (res) {
    res.setEncoding('utf8')
    res.pipe(bl(function (err, resBuffer) {
      var response

      if (err) {
        debug('There was an error when connecting to the Trace API, retrying', err)
        return setTimeout(function () {
          _this.getService()
        }, _this._getRetryInterval())
      }

      var resText = resBuffer.toString('utf8')

      debug('raw response from trace servers: ', resText)
      if (res.statusCode === 401) {
        return console.error(format('%s trace: error: %s', new Date(), 'TRACE_API_KEY got rejected - are you sure you are using the right one?'))
      }
      if (res.statusCode > 399) {
        return setTimeout(function () {
          _this.getService(cb)
        }, _this._getRetryInterval())
      }

      try {
        response = JSON.parse(resText)
      } catch (ex) {
        debug('Error parsing JSON:', ex)
        return debug(ex)
      }

      _this.serviceKey = response.key
      cb(null, response.key)
    }))
  })

  req.write(payload)
  req.end()
}

function create (options) {
  return new CollectorApi(options)
}

module.exports.create = create
