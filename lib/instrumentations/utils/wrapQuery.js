var consts = require('../../consts')
var EventEmitter = require('events')

function wrapQuery (original, args, agent, params) {
  var childCommId = agent.generateCommId()
  var clientSendTime = agent.getMicrotime()
  var requestId = agent.getRequestId()
  var _params = params || {}
  var protocol = _params.protocol
  var host = _params.host
  var url = _params.url
  var method = _params.method
  var continuationMethod = _params.continuationMethod || false // promise || readStream || callback

  // custom error parsing depending on the instrumentation
  var parseError = _params.parseError || function () { }

  var reporter = {
    reportSend: function reportSend () {
      agent.clientSend({
        protocol: protocol,
        requestId: requestId,
        childCommId: childCommId,
        host: host,
        time: clientSendTime,
        method: method,
        type: agent.CLIENT_SEND,
        url: url
      })
    },
    reportReceive: function reportReceive (err) {
      var clientReceiveTime = agent.getMicrotime()
      agent.clientReceive({
        protocol: protocol,
        requestId: requestId,
        childCommId: childCommId,
        host: host,
        time: clientReceiveTime,
        url: url,
        method: method,
        mustCollect: err ? consts.MUST_COLLECT.ERROR : undefined,
        responseTime: clientReceiveTime - clientSendTime,
        status: err ? consts.EDGE_STATUS.NOT_OK : consts.EDGE_STATUS.OK,
        statusDescription: parseError(err)
      })
    }
  }

  if (continuationMethod === 'promise') {
    return wrapPromise.call(this, original, args, reporter)
  } else if (continuationMethod === 'readStream') {
    return wrapReadStream.call(this, original, args, reporter)
  } else if (continuationMethod === 'callback') { // uses callback
    return wrapCallback.call(this, original, _params, args, reporter)
  } else {
    return original.apply(this, args) // we might not want to instrument the method
  }
}

function wrapCallback (original, params, args, reporter) {
  var wrappedCallback = function (original) {
    return function (err) {
      reporter.reportReceive(err)
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
  reporter.reportSend()
  return original.apply(this, args)
}

function wrapPromise (original, args, reporter) {
  reporter.reportSend()
  var originalPromise = original.apply(this, args)
  return originalPromise.then(
    function (v) { reporter.reportReceive(); return v },
    function (err) { reporter.reportReceive(err); throw err }
  )
}

function wrapReadStream (original, args, reporter) {
  reporter.reportSend()
  var originalStream = original.apply(this, args)

  originalStream.on('end', function () {
    reporter.reportReceive()
  })

  originalStream.on('error', function (err) {
    reporter.reportReceive(err)

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
