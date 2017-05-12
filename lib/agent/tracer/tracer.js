'use strict'
var assign = require('lodash.assign')
var findIndex = require('lodash.findindex')
var debug = require('../../utils/debug')('agent:tracer')
var uuid = require('uuid')
var maintainedClock = require('../util/maintainedClock')

var Event = require('./event')
var Storage = require('../storage')

function Tracer (options) {
  this.serviceKey = options.serviceKey
  this.storage = Storage.create('agent:tracer')

  this._noStack = options.noStack
}

Tracer.prototype.userSentEvent = function (name, payload, briefcase) {
  var history = briefcase || this._fromSavedHistory(function (e) { return e[1].t === Event.types.SERVER_RECV })

  var parent = history[0] && history[0][1]

  var communicationId = parent && parent.p
  var transactionId = parent && parent.r
  var clockState = maintainedClock.global()
  var timestamp = clockState[0]
  var clockSeq = clockState[1]

  var event = {
    i: timestamp,
    x: clockSeq,
    t: Event.types.USER_SENT,
    r: transactionId,

    p: communicationId,
    d: {
      n: name,
      r: payload
    }
  }

  return { briefcase: [[Event.getLocallyUniqueId(event), event]].concat(history), event: event }
}

Tracer.prototype.userSentError = function (name, error, briefcase) {
  var history = briefcase || this._fromSavedHistory(function (e) { return e[1].t === Event.types.SERVER_RECV })

  var parent = history[0] && history[0][1]

  var communicationId = parent && parent.p
  var transactionId = parent && parent.r
  var clockState = maintainedClock.global()
  var timestamp = clockState[0]
  var clockSeq = clockState[1]

  var self = this

  var event = {
    x: clockSeq,
    t: Event.types.ERROR,
    r: transactionId,
    i: timestamp,
    p: communicationId,
    d: {
      t: Event.errorTypes.USER_SENT,
      n: name,
      r: transformError(error, self._noStack)
    }
  }

  return { briefcase: [[Event.getLocallyUniqueId(event), event]].concat(history), event: event }
}

Tracer.prototype.systemError = function (error, briefcase) {
  var history = briefcase || this._fromSavedHistory(function (e) { return e[1].t === Event.types.SERVER_RECV })

  var parent = history[0]

  var communicationId = parent && parent.p
  var transactionId = parent && parent.r
  var clockState = maintainedClock.global()
  var timestamp = clockState[0]
  var clockSeq = clockState[1]

  var self = this

  var event = {
    x: clockSeq,
    t: Event.types.ERROR,
    r: transactionId,
    i: timestamp,
    p: communicationId,
    d: {
      t: Event.errorTypes.SYSTEM,
      r: transformError(error, self._noStack)
    }
  }

  return { briefcase: [[Event.getLocallyUniqueId(event), event]].concat(history), event: event }
}

Tracer.prototype.networkError = function (error, briefcase) {
  var history = briefcase || this._fromSavedHistory(function (e) { return e[1].t === Event.types.CLIENT_SEND })

  var parent = history[0] && history[0][1]
  if (!parent) {
    var err = new Error('cannot collect NE event without a CS context. Ignoring')
    debug.warn('networkError', err.stack)
    return { error: err }
  }

  var clockState = maintainedClock.global()
  var timestamp = clockState[0]
  var clockSeq = clockState[1]

  var self = this

  var event = {
    x: clockSeq,
    t: Event.types.ERROR,
    r: parent.r,
    i: timestamp,
    p: parent.p,
    d: {
      t: Event.errorTypes.NETWORK,
      r: assign({
        code: error.code,
        host: error.host,
        port: error.port,
        syscall: error.syscall
      }, transformError(error, self._noStack))
    }
  }

  return { briefcase: [[Event.getLocallyUniqueId(event), event]].concat(history), event: event }
}

Tracer.prototype.clientSend = function (payload, briefcase, options) {
  var history = briefcase || this._fromSavedHistory(function (e) { return e[1].t === Event.types.SERVER_RECV })

  var parent = history[0] && history[0][1]

  var parentCommunicationId = parent && parent.p
  var communicationId = uuid.v4()
  var clockState = maintainedClock.global()
  var timestamp = clockState[0]
  var clockSeq = clockState[1]
  var transactionId = (parent && parent.r) || uuid.v4()

  var event = {
    x: clockSeq,
    t: Event.types.CLIENT_SEND,
    r: transactionId,
    i: timestamp,
    p: communicationId,
    c: payload.protocol,
    a: parentCommunicationId,
    ac: payload.action,
    e: payload.resource,
    h: payload.host,
    d: payload.data
  }

  var serviceKey = this.serviceKey

  var duffelBag = {
    transactionId: transactionId,
    timestamp: String(timestamp),
    communicationId: communicationId,
    parentServiceKey: String(serviceKey),
    severity: payload.severity == null ? undefined : String(payload.severity)
  }

  return {
    briefcase: [[Event.getLocallyUniqueId(event), event]].concat(history),
    duffelBag: duffelBag,
    event: event
  }
}

Tracer.prototype.serverRecv = function (payload, duffelBag, options) {
  var clockState = maintainedClock.global()
  var timestamp = clockState[0]
  var clockSeq = clockState[1]

  var communicationId = duffelBag.communicationId || uuid.v4()
  var transactionId = duffelBag.transactionId || uuid.v4()
  var originTimestamp = duffelBag.timestamp
  var parentServiceKey = duffelBag.parentServiceKey

  var event = {
    x: clockSeq,
    t: Event.types.SERVER_RECV,
    r: transactionId,
    i: timestamp,
    p: communicationId,
    o: originTimestamp,
    c: payload.protocol,
    k: parentServiceKey,
    ac: payload.action,
    e: payload.resource,
    h: payload.host,
    d: payload.data
  }

  return { briefcase: [[Event.getLocallyUniqueId(event), event]], event: event }
}

Tracer.prototype.serverSend = function (payload, briefcase, options) {
  var history = briefcase || this._fromSavedHistory(function (e) { return e[1].t === Event.types.SERVER_RECV })

  var parent = history[0] && history[0][1]

  if (!parent) {
    var error = new Error('cannot collect SS event without a SR context. Ignoring')
    debug.warn('serverSend', error.stack)
    return { error: error }
  }

  var clockState = maintainedClock.global()
  var timestamp = clockState[0]
  var clockSeq = clockState[1]

  var event = {
    x: clockSeq,
    t: Event.types.SERVER_SEND,
    r: parent.r,
    i: timestamp,
    p: parent.p,
    c: payload.protocol,
    s: payload.status,
    d: payload.data
  }

  var duffelBag = {
    timestamp: String(timestamp),
    severity: payload.severity == null ? undefined : String(payload.severity),
    targetServiceKey: String(this.serviceKey)
  }

  return { briefcase: [[Event.getLocallyUniqueId(event), event]].concat(history), duffelBag: duffelBag, event: event }
}

Tracer.prototype.clientRecv = function (payload, duffelBag, briefcase) {
  var history = briefcase || this._fromSavedHistory(function (e) { return e[1].t === Event.types.CLIENT_SEND })

  var parent = history[0] && history[0][1]

  if (!parent) {
    var err = new Error('cannot collect CR event without a CS context. Ignoring')
    debug.warn('clientRecv', err.stack)
    return { error: err }
  }

  var clockState = maintainedClock.global()
  var timestamp = clockState[0]
  var clockSeq = clockState[1]

  var event = {
    x: clockSeq,
    t: Event.types.CLIENT_RECV,
    r: parent.r,
    i: timestamp,
    k: duffelBag.targetServiceKey,
    p: parent.p,
    o: duffelBag.timestamp,
    c: payload.protocol,
    a: parent.a,
    s: payload.status,
    d: payload.data
  }

  return { briefcase: [[Event.getLocallyUniqueId(event), event]].concat(history), event: event }
}

Tracer.prototype._fromSavedHistory = function (lastValidCheckpoint) {
  var history = this.storage.get()
  if (!history) {
    return []
  }
  history = rewind(history, lastValidCheckpoint)
  return history || []
}

Tracer.prototype.bindToHistory = function (history, listener) {
  var self = this
  return this.storage.bind(function () {
    self.storage.set('default', history)
    return listener.apply(this, arguments)
  })
}

Tracer.prototype.bindEmitter = function (ee) {
  this.storage.bindEmitter(ee)
  return ee
}

Tracer.prototype.getTransactionId = function (briefcase) {
  var history = briefcase || this._fromSavedHistory()
  if (!history.length) {
    return
  }
  return history[0][1].r
}

Tracer.prototype.setServiceKey = function (serviceKey) {
  this.serviceKey = serviceKey
}

module.exports = Tracer
module.exports.create = function (options) {
  return new Tracer(options)
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

function rewind (history, p) {
  if (!p) {
    return history
  }
  var i = findIndex(history, p)
  if (i === -1) {
    return undefined
  }
  return history.slice(i)
}
