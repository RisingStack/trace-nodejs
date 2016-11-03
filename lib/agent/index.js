var EventEmitter = require('events').EventEmitter

var debug = require('debug')('risingstack/trace')
var uuid = require('node-uuid')
var cls = require('continuation-local-storage')
var microtime = require('../optionalDependencies/microtime')

var assign = require('lodash.assign')

var CollectorApi = require('./api')
var Metrics = require('./metrics')
var Healthcheck = require('./healthcheck')
var consts = require('../consts')
var ReservoirSampler = require('./reservoir_sampler')
var Profiler = require('./profiler')
var Control = require('./control')
var Security = require('./security')

var Timer = require('./timer')

var controlBus = new EventEmitter()

var REQUEST_ID = 'request-id'
var PARENT_COMM_ID = 'parent-comm-id'
var MUST_COLLECT_LIMIT = 100

function Agent (options) {
  debug('Agent is initializing...')
  var _this = this
  this.cls = cls.createNamespace('trace')
  this.collectorApi = CollectorApi.create(options.config)
  // config
  this.config = options.config

  this.apmMetrics = Metrics.apm.create({
    collectorApi: this.collectorApi,
    config: this.config
  })

  this.healthcheck = Healthcheck.create({
    collectorApi: this.collectorApi,
    config: this.config
  })

  this.rpmMetrics = Metrics.rpm.create({
    collectorApi: this.collectorApi,
    config: this.config
  })

  this.externalEdgeMetrics = Metrics.externalEdge.create({
    collectorApi: this.collectorApi,
    config: this.config
  })

  this.incomingEdgeMetrics = Metrics.incomingEdge.create({
    collectorApi: this.collectorApi,
    config: this.config
  })

  this.memoryProfiler = Profiler.memory.create({
    collectorApi: this.collectorApi,
    config: this.config,
    controlBus: controlBus
  })

  this.cpuProfiler = Profiler.cpu.create({
    collectorApi: this.collectorApi,
    config: this.config,
    controlBus: controlBus
  })

  this.control = Control.create({
    collectorApi: this.collectorApi,
    config: this.config,
    controlBus: controlBus
  })

  this.customMetrics = Metrics.customMetrics.create({
    collectorApi: this.collectorApi,
    config: this.config
  })

  this.security = Security.create({
    collectorApi: this.collectorApi,
    config: this.config
  })

  // TODO: The Tracer agent, to be extracted
  this.name = 'Tracer'

  this.collectInterval = this.config.collectInterval

  this.totalRequestCount = 0
  this.mustCollectCount = 0

  // init required variables
  this.partials = {}

  this.reservoirSampler = new ReservoirSampler(MUST_COLLECT_LIMIT)

  this.timer = new Timer(function () {
    _this._send()
  }, this.collectInterval)

  this.tracer = this

  //

  this.agents = [
    this.tracer,
    this.apmMetrics,
    this.healthcheck,
    this.rpmMetrics,
    this.externalEdgeMetrics,
    this.incomingEdgeMetrics,
    this.customMetrics,
    this.memoryProfiler,
    this.cpuProfiler,
    this.control,
    this.security
  ]
}

Agent.prototype.start = function () {
  var _this = this
  this.collectorApi.getService(function (err, serviceKey) {
    if (err) {
      return debug(err.message)
    }
    debug('Agent serviceKey is set to: ', serviceKey)
    _this.serviceKey = serviceKey
    _this._startAll()
  })
}

Agent.prototype._startAll = function () {
  this.agents.forEach(function (agent) {
    debug(agent.name + ' started')
    if (agent.timer != null) {
      agent.timer.start()
    }
  })
}

Agent.prototype._stopAll = function () {
  this.agents.forEach(function (agent) {
    debug(agent.name + ' stopped')
    if (agent.timer != null) {
      agent.timer.end()
    }
  })
}

Agent.prototype.getServiceKey = function () {
  return this.serviceKey
}

Agent.prototype.getConfig = function () {
  return this.config
}

Agent.prototype.serverReceive = function (data) {
  this.totalRequestCount++
  var parentCommId = data.parentCommId
  var span = this.openSpan(data.requestId)
  var parentServiceId

  if (!isNaN(data.parentServiceId)) {
    parentServiceId = parseInt(data.parentServiceId, 10)
  }

  var transportDelay = data.time - data.originTime

  this.incomingEdgeMetrics.report({
    serviceKey: data.parentServiceId,
    protocol: data.protocol,
    transportDelay: transportDelay
  })

  span.events.push({
    time: data.time || microtime.now(),
    type: Agent.SERVER_RECV,
    data: assign({}, data.protocolData
      ? data.protocolData
      : {}, {
        host: data.host,
        protocol: data.protocol,
        rpcId: parentCommId,
        endpoint: data.url,
        method: data.method,
        parent: parentServiceId,
        originTime: data.originTime
      })
  })
}

Agent.prototype.serverSend = function (data) {
  var parentCommId = data.parentCommId
  var span = this.findSpan(data.requestId)

  if (!span) {
    debug('span was not found for serverSend - it shouldn\'t happen', data.requestId, data.parentCommId)
    return
  }

  span.events.push({
    time: data.time || microtime.now(),
    type: Agent.SERVER_SEND,
    data: assign({}, data.protocolData
      ? data.protocolData
      : {}, {
        protocol: data.protocol,
        rpcId: parentCommId,
        status: data.status === consts.EDGE_STATUS.OK ? 'ok' : 'bad',
        statusDescription: data.statusDescription
      })
  })

  span.isForceSampled = span.isForceSampled || data.mustCollect === consts.MUST_COLLECT.ERROR

  if (span.isForceSampled) {
    this.reservoirSampler.addReturnsSuccess(span)
  }

  delete this.partials[data.requestId]
}

Agent.prototype.clientSend = function (data) {
  var span = this.findSpan(data.requestId)

  if (!span) {
    return
  }

  var event = {
    time: data.time || microtime.now(),
    type: Agent.CLIENT_SEND,
    data: assign({}, data.protocolData
      ? data.protocolData
      : {}, {
        protocol: data.protocol,
        rpcId: data.childCommId,
        host: data.host,
        endpoint: data.url,
        method: data.method
      })
  }

  span.events.push(event)

  var hasServerReceive = span.events.some(function (event) {
    return event.type === Agent.SERVER_RECV
  })

  var hasClientSend = span.events.some(function (event) {
    return event.type === Agent.CLIENT_SEND
  })

  // for now worker requests are not supported, clean them up
  if (!hasServerReceive && hasClientSend) {
    delete this.partials[data.requestId]
  }
}

Agent.prototype.clientReceive = function (data) {
  var span = this.findSpan(data.requestId)

  // report external edges only if service is not instrumented by Trace
  if (typeof data.targetServiceKey === 'undefined') {
    if (!data.statusCode || data.statusCode < 500) {
      this.externalEdgeMetrics.report({
        targetHost: data.host,
        protocol: data.protocol,
        status: data.status,
        responseTime: data.responseTime
      })
    }
  }

  if (!span) {
    return
  }

  data.time = data.time || this.getMicrotime()

  if (data.err) {
    span.isForceSampled = true
  }

  var event = {
    time: data.time || this.getMicrotime()
  }

  if (data.err) {
    assign(event, {
      type: Agent.ERROR,
      data: {
        rpcId: data.childCommId,
        type: 'network-error',
        message: data.err.message,
        raw: data.err.raw
      }
    })
  } else {
    assign(event, {
      type: Agent.CLIENT_RECV,
      data: assign({}, data.protocolData
        ? data.protocolData
        : {}, {
          protocol: data.protocol,
          rpcId: data.childCommId,
          status: data.status === consts.EDGE_STATUS.OK ? 'ok' : 'bad',
          statusDescription: data.statusDescription
        })
    })
  }

  span.events.push(event)
}

Agent.prototype.onCrash = function (data) {
  var span = this.findSpan(this.getRequestId())
  var parentCommId = this.getParentCommId()
  var crashWithoutSpan

  if (!span) {
    // we have a crash which does not belong to an open transaction
    // creating one
    crashWithoutSpan = true
    parentCommId = this.generateCommId()

    span = this.openSpan(this.generateRequestId())
    span.events.push({
      type: Agent.SERVER_RECV,
      time: this.getMicrotime(),
      data: {
        method: 'ERROR',
        endpoint: 'stacktrace',
        rpcId: parentCommId
      }
    })
  }

  span.isForceSampled = true

  span.events.push({
    time: this.getMicrotime(),
    type: Agent.ERROR,
    data: {
      rpcId: parentCommId,
      type: 'system-error',
      message: data.stackTrace.message,
      raw: {
        stack: this.config.disableStackTrace ? undefined : data.stackTrace.stack
      }
    }
  })

  if (crashWithoutSpan) {
    // faking the server send event
    span.events.push({
      time: microtime.now(),
      type: Agent.SERVER_SEND,
      data: {
        rpcId: parentCommId,
        statusCode: 500
      }
    })
  }

  this.reservoirSampler.addReturnsSuccess(span)

  this._send({
    isSync: true
  })
}

Agent.prototype.report = function (name, data, error) {
  var requestId = this.getRequestId()
  var parentCommId = this.getParentCommId()
  var span = this.findSpan(requestId)

  if (!span) {
    return
  }

  var event = {
    time: microtime.now()
  }
  if (error) {
    span.isForceSampled = true
    assign(event, {
      type: Agent.ERROR,
      data: {
        rpcId: parentCommId,
        name: name,
        type: 'user-sent-error',
        message: data.message,
        raw: data
      }
    })
  } else {
    assign(event, {
      type: Agent.USER_SENT,
      data: {
        rpcId: parentCommId,
        name: name,
        raw: data
      }
    })
  }

  // check if we already have a user-sent event with the same name
  var isFound = span.events.some(function (event) {
    return event.data && event.data.name === name
  })

  if (!isFound) {
    span.events.push(event)
    this.partials[requestId] = span
  } else {
    debug('Already has a user-sent event with the name "%s"', name)
  }
}

Agent.prototype.reportError = function (errorName, errorData) {
  this.report(errorName, errorData, true)
}

Agent.prototype.findSpan = function (requestId) {
  var span
  // check if we have a partial with the id
  if (!requestId || !this.partials[requestId] || !this.partials[requestId].events) {
    debug('missing transaction', requestId)
    return
  }

  span = this.partials[requestId]
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

Agent.prototype.openSpan = function (requestId) {
  if (!requestId) {
    return
  }

  var newSpan = {
    requestId: requestId,
    isSampled: false,
    isForceSampled: false,
    events: []
  }
  this.partials[requestId] = this.partials[requestId] || newSpan
  return this.partials[requestId]
}

Agent.prototype.setRequestId = function (value) {
  return this.cls.set(REQUEST_ID, value)
}

Agent.prototype.getRequestId = function () {
  return this.cls.get(REQUEST_ID)
}

Agent.prototype.setParentCommId = function (value) {
  return this.cls.set(PARENT_COMM_ID, value)
}

Agent.prototype.getParentCommId = function () {
  return this.cls.get(PARENT_COMM_ID)
}

Agent.prototype.clearRequest = function (requestId) {
  delete this.partials[requestId]
}

Agent.prototype.bind = function (fn) {
  return this.cls.bind(fn)
}

Agent.prototype.bindEmitter = function (emitter) {
  return this.cls.bindEmitter(emitter)
}

Agent.prototype.generateCommId = function () {
  return this.generateId()
}

Agent.prototype.generateRequestId = function () {
  return this.generateId()
}

Agent.prototype.generateId = function () {
  return uuid.v4()
}

Agent.prototype.getMicrotime = function () {
  return microtime.now()
}

Agent.prototype._send = function (options) {
  debug('sending logs to the trace service')
  var spans = this.reservoirSampler.getItems()
  if (spans.length > 0) {
    var dataBag = {
      sample: {
        rate: 1,
        totalRequestCount: 1
      },
      spans: spans
    }

    this.totalRequestCount = 0
    this.reservoirSampler = new ReservoirSampler(MUST_COLLECT_LIMIT)
    this.collectorApi.sendSamples(dataBag, options && options.isSync)
  }
}

module.exports.CLIENT_SEND = Agent.CLIENT_SEND = 'cs'
module.exports.CLIENT_RECV = Agent.CLIENT_RECV = 'cr'
module.exports.SERVER_SEND = Agent.SERVER_SEND = 'ss'
module.exports.SERVER_RECV = Agent.SERVER_RECV = 'sr'
module.exports.ERROR = Agent.ERROR = 'err'
module.exports.USER_SENT = Agent.USER_SENT = 'us'

module.exports.create = function (options) {
  return new Agent(options)
}
