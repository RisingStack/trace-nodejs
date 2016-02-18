var debug = require('debug')('risingstack/trace')
var microtime = require('microtime')
var uuid = require('node-uuid')
var cls = require('continuation-local-storage')
var defaults = require('lodash.defaults')

var CollectorApi = require('./api')
var Metrics = require('./metrics')

var REQUEST_ID = 'request-id'
var SPAN_ID = 'span-id'

function Agent (options) {
  debug('Agent is initializing...')
  var _this = this
  this.cls = cls.createNamespace('trace')
  this.collectorApi = CollectorApi.create(options.config)

  // config
  this.config = options.config
  this.collectInterval = this.config.collectInterval
  this.sampleRate = this.config.initialSampleRate
  this.sampleSize = this.config.sampleSize

  this.totalRequestCount = 0

  // init required variables
  this.partials = {}
  this.spans = []

  this.apmMetrics = Metrics.apm.create({
    collectorApi: this.collectorApi,
    config: this.config
  })

  this.rpmMetrics = Metrics.rpm.create({
    collectorApi: this.collectorApi,
    config: this.config
  })

  this.collectorApi.getService(function (err, serviceKey) {
    if (err) {
      return debug(err.message)
    }
    debug('Agent serviceKey is set to: ', serviceKey)
    _this.serviceKey = serviceKey
    _this.start()
  })
}

Agent.prototype.start = function () {
  var _this = this
  debug('Agent started collecting')
  this.transactionIntervalId = setInterval(function () {
    _this._send()
  }, this.collectInterval)
}

Agent.prototype.stop = function () {
  debug('Agent stopped collecting')
  clearInterval(this.transactionIntervalId)
}

Agent.prototype.getServiceKey = function () {
  return this.serviceKey
}

Agent.prototype.getConfig = function () {
  return this.config
}

Agent.prototype.serverReceive = function (data) {
  this.totalRequestCount++
  var spanId = data.spanId
  var parentId = data.parentId
  var originTime = data.originTime

  var span = this.openSpan(data)
  span.method = data.method
  span.origin = originTime
  span.parent = parentId
  span.events.push({
    id: spanId,
    time: data.time || microtime.now(),
    type: Agent.SERVER_RECV
  })
}

Agent.prototype.serverSend = function (data) {
  var spanId = data.spanId
  var span = this.findSpan(data.id)

  if (!span) {
    debug('span was not found for serverSend - it shouldn\'t happen', data.id, data.spanId)
    return
  }

  span.statusCode = data.statusCode
  span.events.push({
    id: spanId,
    time: data.time || microtime.now(),
    type: Agent.SERVER_SEND
  })

  span.isSampled = (1 / this.sampleRate) > Math.random()
  span.isForceSampled = span.isForceSampled || !!data.mustCollect

  if (span.isForceSampled || span.isSampled) {
    this.spans.push(span)
  }

  this.rpmMetrics.addResponseTime(data.responseTime)
  this.rpmMetrics.addStatusCode(span.statusCode)
  delete this.partials[data.id]
}

Agent.prototype.clientSend = function (data) {
  var span = this.findSpan(data.id)

  if (!span) {
    return
  }

  data.time = data.time || microtime.now()

  if (data.err) {
    span.isForceSampled = true
  }

  span.events.push({
    id: data.spanId,
    host: data.host,
    url: data.url,
    time: data.time,
    type: data.err ? 'err' : Agent.CLIENT_SEND,
    data: data.err,
    method: data.method
  })

  var hasServerReceive = span.events.some(function (event) {
    return event.type === Agent.SERVER_RECV
  })

  var hasClientSend = span.events.some(function (event) {
    return event.type === Agent.CLIENT_SEND
  })

  // for now worker requests are not supported, clean them up
  if (!hasServerReceive && hasClientSend) {
    delete this.partials[data.id]
  }
}

Agent.prototype.clientReceive = function (data) {
  var span = this.findSpan(data.id)

  if (!span) {
    return
  }

  data.time = data.time || microtime.now()

  span.events.push({
    host: data.host,
    url: data.url,
    id: data.spanId,
    method: data.method,
    time: data.time,
    type: Agent.CLIENT_RECV
  })
}

Agent.prototype.onCrash = function (data) {
  var span = this.findSpan(this.getTransactionId())
  var spanId = this.getSpanId()

  if (!span) {
    return
  }

  span.isForceSampled = true

  span.events.push({
    time: microtime.now(),
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

Agent.prototype.report = function (name, userData) {
  var traceId = this.getTransactionId()
  var spanId = this.getSpanId()

  var span = this.findSpan(traceId)

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

Agent.prototype.reportError = function (errorName, error) {
  var traceId = this.getTransactionId()
  var spanId = this.getSpanId()

  var span = this.findSpan(traceId)

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
      payload: [{
        stack: error.stack,
        message: error.message
      }]
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

Agent.prototype.findSpan = function (transactionId) {
  var span
  // check if we have a partial with the id
  if (!transactionId || !this.partials[transactionId] || !this.partials[transactionId].events) {
    debug('missing transaction', transactionId)
    return
  }

  span = this.partials[transactionId]
  // check if we had an SR before, if not, discard the span
  var hasServerReceive = span.events.some(function (event) {
    return event.type === Agent.SERVER_RECV
  })

  if (!hasServerReceive) {
    debug('no SR found in findSpan, returning')
    return
  }

  return span
}

Agent.prototype.openSpan = function (data) {
  var traceId = data.id

  if (!traceId) {
    return
  }

  var dataTrace = {
    trace: traceId,
    service: this.serviceKey
  }

  dataTrace.span = data.url
  dataTrace.host = data.host

  // fallback to appName if service id is not present
  if (isNaN(this.serviceKey)) {
    dataTrace.serviceName = this.serviceName
  }

  this.partials[traceId] = defaults(this.partials[traceId] || {}, dataTrace, {
    events: []
  })

  return this.partials[traceId]
}

Agent.prototype.setTransactionId = function (value) {
  return this.cls.set(REQUEST_ID, value)
}

Agent.prototype.getTransactionId = function () {
  return this.cls.get(REQUEST_ID)
}

Agent.prototype.setSpanId = function (value) {
  return this.cls.set(SPAN_ID, value)
}

Agent.prototype.getSpanId = function () {
  return this.cls.get(SPAN_ID)
}

Agent.prototype.bind = function (fn) {
  return this.cls.bind(fn)
}

Agent.prototype.bindEmitter = function (emitter) {
  return this.cls.bindEmitter(emitter)
}

Agent.prototype.generateSpanId = function () {
  return this.generateId()
}

Agent.prototype.generateId = function () {
  return uuid.v1()
}

Agent.prototype._send = function (options) {
  debug('sending logs to the trace service')
  if (this.spans.length > 0) {
    var dataBag = {}
    dataBag.sampleRate = this.sampleRate
    dataBag.samples = this.spans
    dataBag.totalRequestCount = this.totalRequestCount

    this.sampleRate = Math.floor(this.totalRequestCount / this.sampleSize) || 1
    this.totalRequestCount = 0

    this.spans = []
    if (options && options.isSync) {
      this.collectorApi.sendSync(dataBag)
    } else {
      this.collectorApi.sendSamples(dataBag)
    }
  }
}

module.exports.CLIENT_SEND = Agent.CLIENT_SEND = 'cs'
module.exports.CLIENT_RECV = Agent.CLIENT_RECV = 'cr'
module.exports.SERVER_SEND = Agent.SERVER_SEND = 'ss'
module.exports.SERVER_RECV = Agent.SERVER_RECV = 'sr'

module.exports.create = function (options) {
  return new Agent(options)
}
