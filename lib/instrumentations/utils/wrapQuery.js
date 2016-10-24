var microtime = require('../../optionalDependencies/microtime')
var consts = require('../../consts')
var EventEmitter = require('events')

function wrapQuery (original, args, agent, params) {
  var _params = params || {}
  var collector = agent.tracer.collector
  var externalEdgeMetrics = agent.externalEdgeMetrics
  var continuationMethod = _params.continuationMethod || false // promise || readStream || callback

  var reporter = {
    reportSend: function () {
      var briefcase = agent.storage.get('tracer.briefcase')
      var communication = briefcase && briefcase.communication
      var severity = briefcase && briefcase.severity
      return agent.tracer.collector.clientSend({
        protocol: _params.protocol,
        action: _params.method,
        resource: _params.url,
        host: _params.host,
        data: _params.protocolSpecific
      }, {
        communication: communication,
        severity: severity
      })
    },
    reportReceive: function (err, cs) {
      var severity = err
        ? collector.mustCollectSeverity
        : collector.defaultSeverity

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
