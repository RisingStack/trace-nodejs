'use strict'
var microtime = require('../../optionalDependencies/@risingstack/microtime')
var EventEmitter = require('events')
var debug = require('../../utils/debug')('instrumentation')
var format = require('util').format

function wrapQuery (original, args, agent, params) {
  var _params = params || {}
  var collector = agent.tracer.collector
  var externalEdgeMetrics = agent.externalEdgeMetrics
  var continuationMethod = _params.continuationMethod // promise || readStream || callback

  var reporter = {
    reportSend: function () {
      var action = _params.method == null ? 'unknown' : _params.method
      var resource = _params.url == null ? 'unknown' : _params.url

      var cs = agent.tracer.collector.clientSend({
        protocol: _params.protocol,
        action: _params.method,
        resource: _params.url,
        host: _params.host,
        data: _params.protocolSpecific,
        severity: _params.severity
      })

      debug.info('wrapQuery', format('CS(%s) [%s %s %s %s]',
        cs.event.p, _params.protocol,
        action, resource, _params.host))

      return cs
    },

    reportReceive: function (err, cs) {
      var severity = err
        ? collector.mustCollectSeverity
        : collector.defaultSeverity

      var status = err ? 'bad' : 'ok'

      debug.info('wrapQuery', format('CR(%s) [%s %s] [severity: %s]',
        cs.event.p, _params.protocol, status, severity))

      collector.clientRecv({
        protocol: _params.protocol,
        status: err ? 'bad' : 'ok'
      }, {
        severity: severity
      }, cs.briefcase)

      externalEdgeMetrics.report({
        targetHost: _params.host,
        protocol: _params.protocol,
        status: err
          ? externalEdgeMetrics.EDGE_STATUS.NOT_OK
          : externalEdgeMetrics.EDGE_STATUS.OK,
        responseTime: microtime.now() - cs.duffelBag.timestamp
      })
    }
  }

  if (continuationMethod === 'promise') {
    return wrapPromise.call(this, original, args, reporter)
  } else if (continuationMethod === 'eventEmitter') {
    return wrapEventEmitter.call(this, original, args, reporter)
  } else if (continuationMethod === 'callback') { // uses callback
    return wrapCallback.call(this, original, args, reporter)
  } else {
    return original.apply(this, args) // we might not want to instrument the method
  }
}

function wrapCallback (original, args, reporter) {
  var cs
  var wrappedCallback = function (original) {
    return function (err) {
      reporter.reportReceive(err, cs)
      return original.apply(this, arguments)
    }
  }
  var last = args[args.length - 1]
  if (last && typeof last === 'function') {
    args[args.length - 1] = wrappedCallback(last)
  } else if (Array.isArray(last) && typeof last[last.length - 1] === 'function') {
    var lastOfLast = last.length - 1
    args[args.length - 1][lastOfLast] = wrappedCallback(last[lastOfLast])
  } else {
    args.push(wrappedCallback(function () { }))
  }
  cs = reporter.reportSend()
  return original.apply(this, args)
}

function wrapPromise (original, args, reporter) {
  var originalPromise = original.apply(this, args)
  if (originalPromise) {
    var cs = reporter.reportSend()
    return originalPromise.then(
      function (v) {
        reporter.reportReceive(null, cs)
        return v
      },
      function (err) {
        reporter.reportReceive(err, cs)
        throw err
      }
    )
  }
}

function wrapEventEmitter (original, args, reporter) {
  var originalEmitter = original.apply(this, args)

  if (originalEmitter) {
    var cs = reporter.reportSend()
    originalEmitter.on('end', function () {
      reporter.reportReceive(null, cs)
    })

    originalEmitter.on('error', function (err) {
      reporter.reportReceive(err, cs)

      if (typeof originalEmitter.listenerCount === 'function') {
        if (originalEmitter.listenerCount('error') < 2) {
          throw err
        }
      } else if (EventEmitter.listenerCount(originalEmitter, 'error') < 2) {
        throw err
      }
    })
  }

  return originalEmitter
}

module.exports = wrapQuery
