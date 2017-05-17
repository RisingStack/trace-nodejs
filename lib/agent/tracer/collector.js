'use strict'
var Tracer = require('./tracer')
var Event = require('./event')
var Cache = require('./cache')
var ReservoirSampler = require('../util/samplers/reservoir')
var levels = require('./severity')
var unzip = require('lodash.unzip')

function Collector (options, tracer, cache, sampler) {
  this.mustCollectSeverity = levels.ERROR
  if (options && !isNaN(levels[options.collectSeverity])) {
    this.mustCollectSeverity = levels[options.collectSeverity]
  }
  this.defaultSeverity = levels.INFO
  this.tracer = tracer || Tracer.create({
    noStack: options && options.disableStackTrace
  })
  this.cache = cache || Cache.create({
    mustCollectSeverity: this.mustCollectSeverity,
    ttl: 30 * 1000
  })
  this.sampler = sampler || ReservoirSampler.create(options && options.samplerLimit)
}

Collector.prototype.LEVELS = levels

Collector.prototype.userSentEvent = function (name, payload, briefcase) {
  var trace = this.tracer.userSentEvent(name, payload, briefcase)
  if (!trace.briefcase) {
    return trace
  }

  var path = unzip(trace.briefcase)
  this.cache.merge(path[0], path[1], levels.INFO)

  return trace
}

Collector.prototype.userSentError = function (name, error, briefcase) {
  var trace = this.tracer.userSentError(name, error, briefcase)
  if (!trace.briefcase) {
    return trace
  }
  var path = unzip(trace.briefcase)
  this.cache.merge(path[0], path[1], levels.ERROR)
  return trace
}

Collector.prototype.systemError = function (error, briefcase) {
  var trace = this.tracer.systemError(error, briefcase)
  if (!trace.briefcase) {
    return trace
  }
  var path = unzip(trace.briefcase)
  this.cache.merge(path[0], path[1], levels.ERROR)
  return trace
}

Collector.prototype.networkError = function (error, briefcase, options) {
  var trace = this.tracer.networkError(error, briefcase)
  if (!trace.briefcase) {
    return trace
  }
  var path = unzip(trace.briefcase)
  this.cache.merge(path[0], path[1], levels.ERROR)
  this.cache.unlock(path[0])
  var content = this.cache.flush(path[0].slice(-1))
  if (content.length) {
    this.sampler.add(content)
  }
  return trace
}

Collector.prototype.clientSend = function (payload, briefcase) {
  var trace = this.tracer.clientSend(payload, briefcase)
  if (!trace.briefcase) {
    return trace
  }
  var path = unzip(trace.briefcase)
  this.cache.merge(path[0], path[1], payload.severity)
  this.cache.lock(path[0])
  return trace
}

Collector.prototype.serverRecv = function (payload, duffelBag) {
  var trace = this.tracer.serverRecv(payload, duffelBag)
  if (!trace.briefcase) {
    return trace
  }
  var severity = isNaN(Number(duffelBag.severity))
    ? levels.INFO : Number(duffelBag.severity)

  var path = unzip(trace.briefcase)

  this.cache.merge(path[0], path[1], severity)
  this.cache.lock(path[0])
  return trace
}

Collector.prototype.serverSend = function (payload, briefcase) {
  var trace = this.tracer.serverSend(payload, briefcase)
  if (!trace.briefcase) {
    return trace
  }

  var path = unzip(trace.briefcase)
  this.cache.merge(path[0], path[1], payload.severity)
  this.cache.unlock(path[0])
  var content = this.cache.flush(path[0].slice(-1))
  if (content.length) {
    this.sampler.add(content)
  }
  return trace
}

Collector.prototype.clientRecv = function (payload, duffelBag, briefcase) {
  var trace = this.tracer.clientRecv(payload, duffelBag, briefcase)
  if (!trace.briefcase) {
    return trace
  }
  var severity = isNaN(Number(duffelBag.severity))
    ? levels.INFO : Number(duffelBag.severity)

  var path = unzip(trace.briefcase)

  this.cache.merge(path[0], path[1], severity)
  this.cache.unlock(path[0])
  var content = this.cache.flush(path[0].slice(-1))
  if (content.length) {
    this.sampler.add(content)
  }
}

Collector.prototype.sample = function (until) {
  var content = this.cache.flushExpiredChildren([], until)
  if (content.length) {
    this.sampler.add(content)
  }
}

Collector.prototype.sampleAll = function () {
  this.sample(Cache.MAX_TIMESTAMP)
}

Collector.prototype.flush = function () {
  var buffers = this.sampler.flush()
  var duplicates = new Set()
  var id
  var result = []
  buffers.forEach(function (buffer) {
    buffer.forEach(function (event) {
      id = Event.getLocallyUniqueId(event)
      if (!duplicates.has(id)) {
        duplicates.add(id)
        result.push(event)
      }
    })
  })
  return result
}

Collector.prototype.setServiceKey = function (serviceKey) {
  this.serviceKey = serviceKey
  this.tracer.setServiceKey(serviceKey)
}

// Purely for cache management
Collector.prototype.end = function (briefcase) {
  if (!briefcase) {
    return
  }
  var path = unzip(briefcase)
  this.cache.unlock(path[0])
  this.cache.flush(path[0].slice(-1))
}

Collector.prototype.bindToHistory = function (history, listener) {
  return this.tracer.bindToHistory(history, listener)
}

Collector.prototype.bindEmitter = function (ee) {
  return this.tracer.bindEmitter(ee)
}

Collector.prototype.getTransactionId = function (briefcase) {
  return this.tracer.getTransactionId(briefcase)
}

module.exports = Collector
module.exports.create = function (options) {
  return new Collector(options)
}
