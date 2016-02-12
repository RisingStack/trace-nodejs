var events = require('events')
var util = require('util')

var debug = require('debug')('risingstack/trace')
var microtime = require('microtime')

var defaults = require('lodash.defaults')

var getNamespace = require('continuation-local-storage').getNamespace
var wraps = require('./wraps')

/*
 * @class HttpTransaction
 * @constructs HttpTransaction
 * @extends events.EventEmitter
 */
function HttpTransaction (eventBus, options) {
  debug('HttpTransaction is initializing...')

  this.eventBus = eventBus
  events.EventEmitter.call(this)

  this.apiKey = options.apiKey
  this.serviceName = options.serviceName
  this.collectInterval = options.collectInterval
  this.sampleRate = options.initialSampleRate
  this.sampleSize = options.sampleSize
  this.partials = {}
  this.spans = []
  this.rpmMetrics = {}
  this.responseTimes = []
  this.totalRequestCount = 0

  this.on(HttpTransaction.CLIENT_RECV, this.onClientReceive)
  this.on(HttpTransaction.CLIENT_SEND, this.onClientSend)
  this.on(HttpTransaction.SERVER_RECV, this.onServerReceive)
  this.on(HttpTransaction.SERVER_SEND, this.onServerSend)

  wraps.instrument(this, options)

  this.eventBus.on(this.eventBus.TRACE_SERVICE_KEY, this.setService.bind(this))
  this.eventBus.on(this.eventBus.USER_SENT_EVENT, this.report.bind(this))
  this.eventBus.on(this.eventBus.USER_SENT_EVENT_ERROR, this.reportError.bind(this))
}

util.inherits(HttpTransaction, events.EventEmitter)

HttpTransaction.prototype.startCollecting = function () {
  debug('HttpTransaction started collecting')
  var _this = this
  this.transactionIntervalId = setInterval(function () {
    _this._send()
  }, this.collectInterval)
  this.rpmMetricsIntervalId = setInterval(function () {
    _this._sendRpm()
  }, 60 * 1000)
}

HttpTransaction.prototype.stopCollecting = function () {
  debug('HttpTransaction stopped collecting')
  clearInterval(this.transactionIntervalId)
  clearInterval(this.rpmMetricsIntervalId)
}

HttpTransaction.prototype.getService = function () {
  return this.service
}

HttpTransaction.prototype.setService = function (serviceId) {
  debug('HttpTransaction service is set to: ', serviceId)
  debug('HttpTransaction initialized')
  this.service = serviceId
  this.startCollecting()
}

HttpTransaction.prototype.openSpan = function (data) {
  var traceId = data.id

  if (!traceId) {
    return
  }

  var dataTrace = {
    trace: traceId,
    service: this.service
  }

  dataTrace.span = data.url
  dataTrace.host = data.host

  // fallback to appName if service id is not present
  if (isNaN(this.service)) {
    dataTrace.serviceName = this.serviceName
  }

  this.partials[traceId] = defaults(this.partials[traceId] || {}, dataTrace, {
    events: []
  })

  return this.partials[traceId]
}

HttpTransaction.prototype.closeSpan = function (data) {
  var traceId = data.id

  if (!traceId) {
    return
  }

  var dataTrace = {
    trace: traceId,
    service: this.service
  }

  dataTrace.span = data.url
  dataTrace.host = data.host

  // fallback to appName if service id is not present
  if (isNaN(this.service)) {
    dataTrace.serviceName = this.serviceName
  }

  this.partials[traceId] = defaults(this.partials[traceId] || {}, dataTrace, {
    events: []
  })

  return this.partials[traceId]
}

HttpTransaction.prototype.appendToSpan = function (data) {
  var span
  // check if we have a partial with the id
  if (!data || !data.id || !this.partials[data.id] || !this.partials[data.id].events) {
    debug('missing params for appendToSpan', data)
    return
  }

  span = this.partials[data.id]
  // check if we had an SR before, if not, discard the span
  var hasServerReceive = span.events.some(function (event) {
    return event.type === HttpTransaction.SERVER_RECV
  })

  if (!hasServerReceive) {
    debug('no SR found in appendToSpan, returning')
    return
  }

  return span
}

HttpTransaction.prototype.onCrash = function (data) {
  var spanId = data.spanId
  delete data.spanId
  var span = this.appendToSpan(data)

  if (!span) {
    return
  }

  span.isForceSampled = true

  span.events.push({
    time: data.time,
    id: spanId,
    type: 'err',
    data: {
      type: 'system-error',
      message: data.stackTrace.message,
      raw: {
        stack: data.stackTrace.stack
      }
    }
  })

  this.spans.push(span)

  this._send({
    isSync: true
  })
}

HttpTransaction.prototype.onClientSend = function (data) {
  var span = this.appendToSpan(data)

  if (!span) {
    return
  }

  var spanId

  if (data.headers) {
    spanId = data.headers['x-span-id']
  }

  span.events.push({
    host: data.host,
    url: data.url,
    id: spanId,
    method: data.method,
    time: data.time,
    type: HttpTransaction.CLIENT_SEND
  })
}

HttpTransaction.prototype.onClientReceive = function (data) {
  var span = this.appendToSpan(data)

  if (!span) {
    return
  }

  if (data.err) {
    span.isForceSampled = true
  }

  span.events.push({
    id: data.spanId,
    host: data.host,
    url: data.url,
    time: data.time,
    type: data.err ? 'err' : HttpTransaction.CLIENT_RECV,
    data: data.err,
    statusCode: data.statusCode
  })

  var hasServerReceive = span.events.some(function (event) {
    return event.type === HttpTransaction.SERVER_RECV
  })

  var hasClientSend = span.events.some(function (event) {
    return event.type === HttpTransaction.CLIENT_SEND
  })

  // for now worker requests are not supported, clean them up
  if (!hasServerReceive && hasClientSend) {
    delete this.partials[data.id]
  }
}

HttpTransaction.prototype.onServerSend = function (data) {
  var headers = data.headers
  var spanId = headers['x-span-id']

  var span = this.closeSpan(data)
  span.statusCode = data.statusCode
  span.events.push({
    id: spanId,
    time: data.time,
    type: HttpTransaction.SERVER_SEND
  })

  span.isSampled = (1 / this.sampleRate) > Math.random()
  span.isForceSampled =
    span.isForceSampled ||
    !!data.mustCollect

  if (span.isForceSampled || span.isSampled) {
    this.spans.push(span)
  }

  this.collectStatusCode(span)
  this.responseTimes.push(data.responseTime)
  delete this.partials[data.id]
}

HttpTransaction.prototype.collectStatusCode = function (span) {
  if (!this.rpmMetrics[span.statusCode]) {
    this.rpmMetrics[span.statusCode] = 1
  } else {
    this.rpmMetrics[span.statusCode]++
  }
}

HttpTransaction.prototype.onServerReceive = function (data) {
  this.totalRequestCount++
  var headers = data.headers
  var spanId = headers['x-span-id']
  var parentId = headers['x-parent']
  var originTime = headers['x-client-send']

  var span = this.openSpan(data)
  span.method = data.method
  span.origin = originTime
  span.parent = parentId
  span.events.push({
    id: spanId,
    time: data.time,
    type: HttpTransaction.SERVER_RECV
  })
}

HttpTransaction.prototype.report = function (name, userData) {
  var session = getNamespace('trace')
  var traceId = session.get('request-id')
  var spanId = session.get('span-id')

  var span = this.appendToSpan({
    id: traceId
  })

  if (!span) {
    return
  }

  var dataToSend = {
    id: spanId,
    time: microtime.now(),
    type: 'us',
    data: {
      name: name,
      payload: userData
    }
  }

  // check if we already have a user-sent event with the same name
  var isFound = span.events.some(function (event) {
    return event.data && event.data.name === name
  })

  if (!isFound) {
    span.events.push(dataToSend)
    this.partials[traceId] = span
  } else {
    debug('Already has a user-sent event with the name "%s"', name)
  }
}

HttpTransaction.prototype.reportError = function (errorName, error) {
  var session = getNamespace('trace')
  var traceId = session.get('request-id')
  var spanId = session.get('span-id')

  var span = this.appendToSpan({
    id: traceId
  })

  if (!span) {
    return
  }

  span.isForceSampled = true

  var dataToSend = {
    id: spanId,
    time: microtime.now(),
    type: 'us',
    data: {
      name: errorName,
      payload: [error]
    }
  }

  // check if we already have a user-sent event with the same name
  var isFound = span.events.some(function (event) {
    return event.data && event.data.name === errorName
  })

  if (!isFound) {
    span.events.push(dataToSend)
    this.partials[traceId] = span
  } else {
    debug('Already has a user-sent error with the name "%s"', errorName)
  }
}

HttpTransaction.prototype._sendRpm = function () {
  debug('sending rpm metrics to the trace service')
  if (Object.keys(this.rpmMetrics).length > 0 || this.avgResponseTime) {
    this.responseTimes.sort(function (current, next) {
      return current - next
    })

    var medianElementIndex = Math.round(this.responseTimes.length / 2) - 1
    var ninetyFiveElementIndex = Math.round(this.responseTimes.length * 0.95) - 1
    var dataBag = {
      requests: this.rpmMetrics,
      timestamp: new Date().toISOString(),
      median: this.responseTimes[medianElementIndex] || null,
      ninetyFive: this.responseTimes[ninetyFiveElementIndex] || null
    }

    this.eventBus.emit(this.eventBus.RPM_METRICS, dataBag)
    this.rpmMetrics = {}
    this.responseTimes = []
  }
}

HttpTransaction.prototype._send = function (options) {
  options = options || {}
  debug('sending logs to the trace service')
  if (this.spans.length > 0) {
    var dataBag = {}
    dataBag.sampleRate = this.sampleRate
    dataBag.samples = this.spans
    dataBag.totalRequestCount = this.totalRequestCount

    this.sampleRate = Math.floor(this.totalRequestCount / this.sampleSize) || 1
    this.totalRequestCount = 0

    this.spans = []

    if (options.isSync) {
      this.eventBus.emit(this.eventBus.HTTP_TRANSACTION_STACK_TRACE, dataBag)
    } else {
      this.eventBus.emit(this.eventBus.HTTP_TRANSACTION, dataBag)
      debug('logs are being sent to the trace service')
    }
  }
}

// Statics
module.exports.CLIENT_SEND = HttpTransaction.CLIENT_SEND = 'cs'
module.exports.CLIENT_RECV = HttpTransaction.CLIENT_RECV = 'cr'
module.exports.SERVER_SEND = HttpTransaction.SERVER_SEND = 'ss'
module.exports.SERVER_RECV = HttpTransaction.SERVER_RECV = 'sr'

function create (events, config) {
  return new HttpTransaction(events, config)
}

module.exports.create = create
