var EventEmitter = require('events').EventEmitter

var debug = require('debug')('risingstack/trace')

var CollectorApi = require('./api')
var Tracer = require('./tracer')
var Metrics = require('./metrics')
var Healthcheck = require('./healthcheck')
var Profiler = require('./profiler')
var Control = require('./control')
var Security = require('./security')

var Storage = require('./storage')

var controlBus = new EventEmitter()

function Agent (options) {
  debug('Agent is initializing...')
  this._collectorApi = CollectorApi.create(options.config)
  // config
  this.config = options.config

  this.apmMetrics = Metrics.apm.create({
    collectorApi: this._collectorApi,
    config: this.config
  })

  this.healthcheck = Healthcheck.create({
    collectorApi: this._collectorApi,
    config: this.config
  })

  this.rpmMetrics = Metrics.rpm.create({
    collectorApi: this._collectorApi,
    config: this.config
  })

  this.externalEdgeMetrics = Metrics.externalEdge.create({
    collectorApi: this._collectorApi,
    config: this.config
  })

  this.incomingEdgeMetrics = Metrics.incomingEdge.create({
    collectorApi: this._collectorApi,
    config: this.config
  })

  this.memoryProfiler = Profiler.memory.create({
    collectorApi: this._collectorApi,
    config: this.config,
    controlBus: controlBus
  })

  this.cpuProfiler = Profiler.cpu.create({
    collectorApi: this._collectorApi,
    config: this.config,
    controlBus: controlBus
  })

  this.control = Control.create({
    collectorApi: this._collectorApi,
    config: this.config,
    controlBus: controlBus
  })

  this.customMetrics = Metrics.customMetrics.create({
    collectorApi: this._collectorApi,
    config: this.config
  })

  this.security = Security.create({
    collectorApi: this._api,
    config: this.config
  })

  this.tracer = Tracer.create({
    collectorApi: this._collectorApi,
    config: this.config
  })

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
  this.storage = Storage.create()
}

Agent.prototype.start = function () {
  var self = this
  this._collectorApi.getService(function (err, serviceKey) {
    if (err) {
      return debug(err.message)
    }
    debug('Agent serviceKey is set to: ', serviceKey)
    self.serviceKey = serviceKey
    self.agents.forEach(function (agent) {
      debug(agent.name + ' initialized')
      agent.initialize({ serviceKey: serviceKey })
    })
    self._startAll()
  })
}

Agent.prototype.stop = function () {
  this._stopAll()
}

Agent.prototype._startAll = function () {
  this.agents.forEach(function (agent) {
    debug(agent.name + ' started')
    agent.start()
  })
}

Agent.prototype._stopAll = function () {
  this.agents.forEach(function (agent) {
    debug(agent.name + ' stopped')
    agent.stop()
  })
}

Agent.prototype.getServiceKey = function () {
  return this.serviceKey
}

Agent.prototype.getConfig = function () {
  return this.config
}

module.exports.create = function (options) {
  return new Agent(options)
}
