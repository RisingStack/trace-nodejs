'use strict'

var debug = require('debug')('risingstack/trace:agent:tracer:collector')
var microtime = require('../../optionalDependencies/microtime')
var ExpiringBuffer = require('./expiringBuffer')
var uuid = require('node-uuid')
var assign = require('lodash.assign')
var levels = require('./severity')
var some = require('lodash.some')
var ReservoirSampler = require('./reservoirSampler')

var EVENT_TYPE = {
  CLIENT_SEND: 'cs',
  SERVER_SEND: 'ss',
  CLIENT_RECV: 'cr',
  SERVER_RECV: 'sr',
  ERROR: 'err',
  USER_SENT: 'us'
}

var ERROR_TYPE = {
  USER_SENT: 'user-sent-error',
  NETWORK: 'network-error',
  SYSTEM: 'system-error'
}

function transformError (error, noStack) {
  return assign({
    name: error.name,
    message: error.message,
    stack: noStack ? undefined : error.stack,
    lineNumber: error.lineNumber,
    fileName: error.fileName,
    columnNumber: error.columnNumber
  }, error)
}

function Collector (options) {
  this.serviceKey = options.serviceKey
  this.mustCollectSeverity = levels.ERROR
  this.defaultSeverity = levels.INFO
  this.samplerLimit = options.samplerLimit || 100

  // init required variables
  this._noStack = options.noStack
  this._eventTtl = options.eventTtl || 1
  this._eventBuffers = { }
  this._sampler = new ReservoirSampler(this.samplerLimit)
}

Collector.prototype.LEVELS = levels

Collector.prototype.userSentEvent = function (briefcase, name, payload) {
  briefcase = briefcase || {}
  var communicationId = briefcase.communication && briefcase.communication.id
  var transactionId = briefcase.communication && briefcase.communication.transactionId
  var timestamp = microtime.now()

  this._cache(communicationId, {
    t: EVENT_TYPE.USER_SENT,
    r: transactionId,
    i: timestamp,
    p: communicationId,
    d: {
      n: name,
      r: payload
    }
  },
  levels.INFO)

  return { briefcase: briefcase }
}

Collector.prototype.userSentError = function (briefcase, name, error) {
  briefcase = briefcase || {}
  var communicationId = briefcase.communication && briefcase.communication.id
  var transactionId = briefcase.communication && briefcase.communication.transactionId
  var timestamp = microtime.now()

  var self = this

  this._cache(communicationId, {
    t: EVENT_TYPE.ERROR,
    r: transactionId,
    i: timestamp,
    p: communicationId,
    d: {
      t: ERROR_TYPE.USER_SENT,
      n: name,
      r: transformError(error, self._noStack)
    }
  }, levels.ERROR)

  return { briefcase: briefcase }
}

Collector.prototype.systemError = function (briefcase, error) {
  briefcase = briefcase || {}
  var communicationId = briefcase.communication && briefcase.communication.id
  var transactionId = briefcase.communication && briefcase.communication.transactionId
  var timestamp = microtime.now()

  var self = this

  this._cache(communicationId, {
    t: EVENT_TYPE.ERROR,
    r: transactionId,
    i: timestamp,
    p: communicationId,
    d: {
      t: ERROR_TYPE.SYSTEM,
      r: transformError(error, self._noStack)
    }
  }, levels.CRIT)

  return { briefcase: briefcase }
}

Collector.prototype.networkError = function (briefcase, error) {
  briefcase = briefcase || {}
  if (!briefcase.csCtx) {
    var err = new Error('cannot collect network error event without a CS context. Ignoring')
    debug('#networkError', '[Warning]', err.toString())
    return { briefcase: briefcase, error: err }
  }
  var communicationId = briefcase.communication && briefcase.communication.id
  var timestamp = microtime.now()

  var self = this

  var root = !communicationId
  var cacheId = root ? 'root-' + briefcase.csCtx.communicationId : communicationId

  this._cache(cacheId, {
    t: EVENT_TYPE.ERROR,
    r: briefcase.csCtx.transactionId,
    i: timestamp,
    p: briefcase.csCtx.communicationId,
    d: {
      t: ERROR_TYPE.NETWORK,
      r: assign({
        code: error.code,
        host: error.host,
        port: error.port,
        syscall: error.syscall
      }, transformError(error, self._noStack))
    }
  }, levels.ERROR)

  this._removeLockFromCache(cacheId)
  this._flushUnlockedCache(cacheId)

  return { briefcase: briefcase }
}

Collector.prototype.end = function (briefcase, options) {
  var communicationId = briefcase.communication.id

  if (options && options.skip) {
    this._skipCache(communicationId)
  }
  this._removeLockFromCache(communicationId)
  this._flushUnlockedCache(communicationId)
}

Collector.prototype.clientSend = function (payload, briefcase, options) {
  briefcase = briefcase || {}
  var timestamp = microtime.now()

  var parentCommunicationId = briefcase.communication && briefcase.communication.id

  var transactionId = briefcase.communication && briefcase.communication.transactionId

  var root = !parentCommunicationId

  if (!transactionId) {
    root = true
    transactionId = uuid.v4()
  }

  var serviceKey = this.serviceKey

  var communication = {
    id: uuid.v4(),
    parentId: parentCommunicationId,
    transactionId: transactionId
  }

  var context = {
    communicationId: communication.id,
    transactionId: transactionId
  }

  var cacheId = root ? 'root-' + communication.id : communication.parentId

  this._cache(cacheId, {
    t: EVENT_TYPE.CLIENT_SEND,
    r: transactionId,
    i: timestamp,
    p: communication.id,
    c: payload.protocol,
    a: communication.parentId,
    ac: payload.action,
    e: payload.resource,
    h: payload.host,
    d: payload.data
  }, payload.severity != null ? payload.severity : this.defaultSeverity)

  this._addLockToCache(cacheId)

  var severity = this._getSeverityHintFromCache(cacheId)

  var duffelBag = {
    transactionId: transactionId,
    timestamp: timestamp,
    communicationId: communication.id,
    parentServiceKey: serviceKey,
    severity: severity
  }

  return {
    briefcase: assign({ csCtx: context }, briefcase),
    duffelBag: duffelBag
  }
}

Collector.prototype.serverRecv = function (payload, duffelBag, options) {
  var timestamp = microtime.now()

  var communication = {
    id: duffelBag.communicationId || uuid.v4(),
    transactionId: duffelBag.transactionId || uuid.v4()
  }

  var originTimestamp = duffelBag.timestamp
  var parentServiceKey = duffelBag.parentServiceKey

  var briefcase = {
    communication: communication
  }

  this._cache(communication.id, {
    t: EVENT_TYPE.SERVER_RECV,
    r: communication.transactionId,
    i: timestamp,
    p: communication.id,
    o: originTimestamp,
    c: payload.protocol,
    k: parentServiceKey,
    ac: payload.action,
    e: payload.resource,
    h: payload.host,
    d: payload.data
  }, duffelBag.severity)

  this._addLockToCache(communication.id)

  return { briefcase: briefcase }
}

Collector.prototype.serverSend = function (payload, briefcase, options) {
  briefcase = briefcase || {}
  var timestamp = microtime.now()

  if (!briefcase.communication || !briefcase.communication.transactionId) {
    var error = new Error('cannot collect SS event when not in a transaction. Ignoring')
    debug('#serverSend', '[Warning]', error.toString())
    return { briefcase: briefcase, error: error }
  }

  var communicationId = briefcase.communication.id
  var transactionId = briefcase.communication.transactionId

  if (options && options.skip) {
    this._skipCache(communicationId)
  } else {
    this._cache(communicationId, {
      t: EVENT_TYPE.SERVER_SEND,
      r: transactionId,
      i: timestamp,
      p: communicationId,
      c: payload.protocol,
      s: payload.status,
      d: payload.data
    }, payload.severity != null ? payload.severity : this.defaultSeverity)
  }

  this._removeLockFromCache(communicationId)
  this._flushUnlockedCache(communicationId)

  var severity = this._getSeverityHintFromCache(communicationId)

  var duffelBag = {
    timestamp: timestamp,
    severity: severity,
    targetServiceKey: this.serviceKey
  }

  return { briefcase: briefcase, duffelBag: duffelBag }
}

Collector.prototype.clientRecv = function (payload, duffelBag, briefcase) {
  briefcase = briefcase || {}
  var timestamp = microtime.now()
  if (!briefcase.csCtx) {
    var err = new Error('cannot collect CR event without a CS context. Ignoring')
    debug('#clientRecv', '[Warning]', err.toString())
    return { briefcase: briefcase, error: err }
  }

  var communication = {
    id: briefcase.csCtx.communicationId,
    transactionId: briefcase.csCtx.transactionId,
    parentId: briefcase.communication && briefcase.communication.id
  }

  var root = !communication.parentId

  var cacheId = root ? 'root-' + briefcase.csCtx.communicationId : communication.parentId

  this._cache(cacheId, {
    t: EVENT_TYPE.CLIENT_RECV,
    r: communication.transactionId,
    i: timestamp,
    k: duffelBag.targetServiceKey,
    p: communication.id,
    o: duffelBag.timestamp,
    c: payload.protocol,
    a: communication.parentId,
    s: payload.status,
    d: payload.data
  }, duffelBag.severity)

  this._removeLockFromCache(cacheId)
  this._flushUnlockedCache(cacheId)

  return { briefcase: briefcase }
}

Collector.prototype._cache = function (cacheId, data, severity) {
  cacheId = cacheId || 'root'
  if (severity == null) {
    severity = this.defaultSeverity
  }
  if (this._eventBuffers[cacheId] == null) {
    this._eventBuffers[cacheId] = {
      skipped: false,
      locks: 0,
      severityBuf: new ExpiringBuffer(this._eventTtl),
      eventBuf: new ExpiringBuffer(this._eventTtl)
    }
  } else if (this._eventBuffers[cacheId].skipped) {
    return
  }
  this._eventBuffers[cacheId].eventBuf.push(data)
  this._eventBuffers[cacheId].severityBuf.push(severity)
}

Collector.prototype._skipCache = function (cacheId) {
  cacheId = cacheId || 'root'
  if (this._eventBuffers[cacheId]) {
    this._eventBuffers[cacheId].severityBuf.clear()
    this._eventBuffers[cacheId].eventBuf.clear()
    this._eventBuffers[cacheId].skipped = true
  }
}

Collector.prototype._deleteCache = function (cacheId) {
  cacheId = cacheId || 'root'
  delete this._eventBuffers[cacheId]
}

Collector.prototype._addLockToCache = function (cacheId) {
  cacheId = cacheId || 'root'
  if (this._eventBuffers[cacheId]) {
    ++this._eventBuffers[cacheId].locks
  }
}

Collector.prototype._removeLockFromCache = function (cacheId) {
  cacheId = cacheId || 'root'
  if (this._eventBuffers[cacheId]) {
    if (this._eventBuffers[cacheId].locks > 0) {
      --this._eventBuffers[cacheId].locks
    }
  }
}

Collector.prototype._flushUnlockedCache = function (cacheId) {
  cacheId = cacheId || 'root'
  var self = this
  if (this._eventBuffers[cacheId] && this._eventBuffers[cacheId].locks === 0) {
    if (!this._eventBuffers[cacheId].skipped &&
        some(this._eventBuffers[cacheId].severityBuf.elements(), function (severity) {
          return levels.gte(severity, self.mustCollectSeverity)
        })) {
      var events = this._eventBuffers[cacheId].eventBuf.flush()
      if (events.length) {
        this._sampler.add(events)
      }
    }
    delete this._eventBuffers[cacheId]
  }
}

Collector.prototype._getSeverityHintFromCache = function (cacheId) {
  if (this._eventBuffers[cacheId]) {
    return this._eventBuffers[cacheId].severityBuf.elements().reduce(function (acc, x) {
      return levels.gte(acc, x) ? acc : x
    })
  } else {
    return this.defaultSeverity
  }
}

Collector.prototype.collect = function () {
  var self = this
  Object.keys(this._eventBuffers).forEach(function (key) {
    if (self._eventBuffers[key].locks > 0) {
      return
    } else {
      if (!self._eventBuffers[key].skipped &&
          some(self._eventBuffers[key].severityBuf.elements(), function (severity) {
            return levels.gte(severity, self.mustCollectSeverity)
          })) {
        var events = self._eventBuffers[key].eventBuf.flush()
        if (events.length) {
          self._sampler.add(events)
        }
      }
      self._eventBuffers[key].eventBuf.expire()
      self._eventBuffers[key].severityBuf.expire()

      if (self._eventBuffers[key].skipped ||
            self._eventBuffers[key].severityBuf.isEmpty()) {
        delete self._eventBuffers[key]
      }
    }
  })
  return this._sampler.flush().reduce(function (acc, x) {
    Array.prototype.push.apply(acc, x)
    return acc
  }, [])
}

Collector.prototype.getTransactionId = function (briefcase) {
  return briefcase && briefcase.communication && briefcase.communication.transactionId
}

module.exports = Collector
