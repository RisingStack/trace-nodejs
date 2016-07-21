var consts = require('../../consts')

function wrapQuery (original, args, agent, params) {
  var childCommId = agent.generateCommId()
  var clientSendTime = agent.getMicrotime()
  var requestId = agent.getRequestId()
  var _params = params || {}
  var protocol = _params.protocol
  var host = _params.host
  var url = _params.url
  var method = _params.method
  var returnsPromise = _params.returnsPromise || false
  var disableCallback = _params.disableCallback

  // custom error parsing depending on the instrumentation
  var parseError = _params.parseError || function () { }

  var reportSend = function reportSend () {
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
  }

  var reportReceive = function reportReceive (err) {
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

  if (returnsPromise) {
    reportSend()
    var originalPromise = original.apply(this, args)
    return originalPromise.then(
      function (v) { reportReceive(); return v },
      function (err) { reportReceive(err); return err }
    )
  } else { // uses callback
    var wrappedCallback = function (original) {
      return function (err) {
        reportReceive(err)
        return original.apply(this, arguments)
      }
    }
    var last = args[args.length - 1]
    if (last && typeof last === 'function') {
      args[args.length - 1] = wrappedCallback(last)
    } else if (Array.isArray(last) && typeof last[last.length - 1] === 'function') {
      var lastOfLast = last.length - 1
      args[args.length - 1][lastOfLast] = wrappedCallback(last[lastOfLast])
    } else if (!disableCallback) {
      args.push(wrappedCallback(function () { }))
    }
    reportSend()
    return original.apply(this, args)
  }
}

module.exports = wrapQuery
