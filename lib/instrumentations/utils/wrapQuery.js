var microtime = require('../../optionalDependencies/microtime')
var EventEmitter = require('events')
var debug = require('debug')('risingstack/trace:agent:instrumentations')
var format = require('util').format

function wrapQuery (original, args, agent, params) {
  var _params = params || {}
  var collector = agent.tracer.collector
  var externalEdgeMetrics = agent.externalEdgeMetrics
  var continuationMethod = _params.continuationMethod || false // promise || readStream || callback

  var reporter = {
    reportSend: function () {
      var briefcase = agent.storage.get('tracer.briefcase')
      var communication = briefcase && briefcase.communication

      var action = _params.method == null ? 'unknown' : _params.method
      var resource = _params.url == null ? 'unknown' : _params.url

      var cs = agent.tracer.collector.clientSend({
        protocol: _params.protocol,
        action: _params.method,
        resource: _params.url,
        host: _params.host,
        data: _params.protocolSpecific,
        severity: _params.severity
      }, {
        communication: communication
      })

      debug('#wrapQuery', format('CS(%s) [%s %s %s %s]',
        cs.briefcase.csCtx.communicationId, _params.protocol,
        action, resource, _params.host))

      return cs
    },

    reportReceive: function (err, cs) {
      var severity = err
        ? collector.mustCollectSeverity
        : collector.defaultSeverity

      var status = err ? 'bad' : 'ok'

      debug('#wrapQuery', format('CR(%s) [%s %s] [severity: %s]',
        cs.briefcase.csCtx.communicationId, _params.protocol, status, severity))

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
  } else if (continuationMethod === 'readStream') {
    return wrapReadStream.call(this, original, args, reporter)
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
  var cs = reporter.reportSend()
  var originalPromise = original.apply(this, args)
  return originalPromise.then(
    function (v) { reporter.reportReceive(null, cs); return v },
    function (err) { reporter.reportReceive(err, cs); throw err }
  )
}

function wrapReadStream (original, args, reporter) {
  var cs = reporter.reportSend()
  var originalStream = original.apply(this, args)

  originalStream.on('end', function () {
    reporter.reportReceive(null, cs)
  })

  originalStream.on('error', function (err) {
    reporter.reportReceive(err, cs)

    if (typeof originalStream.listenerCount === 'function') {
      if (originalStream.listenerCount('error') < 2) {
        throw err
      }
    } else if (EventEmitter.listenerCount(originalStream, 'error') < 2) {
      throw err
    }
  })

  return originalStream
}

module.exports = wrapQuery
