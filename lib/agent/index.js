'use strict'
var EventEmitter = require('events').EventEmitter

var debug = require('../utils/debug')('agent')

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
  debug.info('Agent', 'Initializing api client...')
  this._api = CollectorApi.create(options.config)
  // config
  this.config = options.config

  this.apmMetrics = Metrics.apm.create({
    collectorApi: this._api,
    config: this.config
  })

  this.healthcheck = Healthcheck.create({
    collectorApi: this._api,
    config: this.config
  })

  this.rpmMetrics = Metrics.rpm.create({
    collectorApi: this._api,
    config: this.config
  })

  this.externalEdgeMetrics = Metrics.externalEdge.create({
    collectorApi: this._api,
    config: this.config
  })

  this.incomingEdgeMetrics = Metrics.incomingEdge.create({
    collectorApi: this._api,
    config: this.config
  })

  this.memoryProfiler = Profiler.memory.create({
    collectorApi: this._api,
    config: this.config,
    controlBus: controlBus
  })

  this.cpuProfiler = Profiler.cpu.create({
    collectorApi: this._api,
    config: this.config,
    controlBus: controlBus
  })

  this.control = Control.create({
    collectorApi: this._api,
    config: this.config,
    controlBus: controlBus
  })

  this.customMetrics = Metrics.customMetrics.create({
    collectorApi: this._api,
    config: this.config
  })

  this.security = Security.create({
    collectorApi: this._api,
    config: this.config
  })

  this.tracer = Tracer.create({
    collectorApi: this._api,
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
  this._api.getService(function (err, serviceKey) {
    if (err) {
      return debug.error('start', 'Error starting service: ' + err.stack)
    }
    debug.info('start', 'ServiceKey is set to: ' + serviceKey)
    self.serviceKey = serviceKey
    debug.info('start', 'Starting agents...')
    self.agents.forEach(function (agent) {
      agent.initialize({ serviceKey: serviceKey })
      agent.start()
      debug.info('start', agent.name + ' started')
    })
  })
}

Agent.prototype.stop = function (callback) {
  debug.info('stop', 'Stopping agents...')
  var agents = this.agents
  var counter = 1
  var error

  agents.forEach(function (agent) {
    agent.stop(function (err) {
      if (!error && err) {
        error = err
      }

      if (counter >= agents.length) {
        if (callback && typeof callback === 'function') {
          callback(error)
        }
      } else {
        counter++
      }
    })
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
