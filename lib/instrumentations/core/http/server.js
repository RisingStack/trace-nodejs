var microtime = require('../../../optionalDependencies/microtime')
var isNumber = require('lodash.isnumber')
var debug = require('debug')('risingstack/trace')

var util = require('./util')
var consts = require('../../../consts')

function isPathIgnored (ignorePaths, currentPath) {
  if (!ignorePaths || !ignorePaths.length) {
    return false
  }

  for (var i = 0; i < ignorePaths.length; i++) {
    if (currentPath.match(ignorePaths[i])) {
      return true
    }
  }

  return false
}

function isStatusCodeIgnored (ignoreStatusCodes, statusCode) {
  if (!ignoreStatusCodes || !ignoreStatusCodes.length) {
    return false
  }

  for (var i = 0; i < ignoreStatusCodes.length; i++) {
    if (statusCode === ignoreStatusCodes[i]) {
      return true
    }
  }

  return false
}

function wrapListener (listener, agent, mustCollectStore) {
  var config = agent.getConfig()
  var ignoreHeaders = config.ignoreHeaders
  var ignorePaths = config.ignorePaths
  var ignoreStatusCodes = config.ignoreStatusCodes

  return function (request, response) {
    var requestUrl = request.url.split('?')[0]
    var serverReceiveTime

    var headers = request.headers
    var spanId = headers['x-span-id']

    var isSkippedHeader = ignoreHeaders && Object.keys(ignoreHeaders).some(function (key) {
      return headers[key] && (ignoreHeaders[key].indexOf('*') > -1 || ignoreHeaders[key].indexOf(headers[key]) > -1)
    })

    if (isSkippedHeader || isPathIgnored(ignorePaths, requestUrl)) {
      debug('trace event (sr); request skipped because of ignore options', headers)
      return listener.apply(this, arguments)
    }

    var originalWriteHead = response.writeHead

    var requestId = headers['request-id'] || headers['x-request-id'] || agent.generateId()

    debug('trace event (sr); request: %s', requestId, headers)

    // must be collected
    if (headers['x-must-collect']) {
      debug('trace event (sr); request: %s, set must collect store', requestId)
      mustCollectStore[requestId] = consts.MUST_COLLECT.ERROR
    }

    // setting the spanId in cls
    if (spanId) {
      agent.setSpanId(spanId)
    }

    var method = request.method
    serverReceiveTime = microtime.now()

    var serverReceiveData = {
      id: requestId,
      spanId: spanId,
      host: headers.host,
      url: util.formatDataUrl(requestUrl),
      time: serverReceiveTime,
      method: method,
      protocol: consts.PROTOCOLS.HTTP,
      parentId: headers['x-parent'],
      originTime: headers['x-client-send']
    }

    // Collect request start
    agent.serverReceive(serverReceiveData)

    var serverSendTime
    /*
     * @method instrumentedFinish
     */
    function instrumentedFinish () {
      var responseTime = serverSendTime - serverReceiveTime

      agent.rpmMetrics.addResponseTime(responseTime)
      agent.rpmMetrics.addStatusCode(response.statusCode)

      if (isStatusCodeIgnored(ignoreStatusCodes, response.statusCode)) {
        agent.clearTransaction(requestId)
        return debug('statusCode %s is ignored', response.statusCode)
      }

      var serverSendData = {
        mustCollect: mustCollectStore[requestId],
        id: requestId,
        spanId: headers['x-span-id'],
        host: headers.host,
        url: util.formatDataUrl(requestUrl),
        time: serverSendTime,
        protocol: consts.PROTOCOLS.HTTP,
        statusCode: response.statusCode,
        responseTime: responseTime
      }

      // Collect request ended
      debug('trace event (ss); request: %s, request finished', requestId)
      agent.serverSend(serverSendData)
      delete mustCollectStore[requestId]
    }

    response.once('finish', instrumentedFinish)

    response.writeHead = function (statusCode) {
      var _statusCode = statusCode || response.statusCode

      serverSendTime = microtime.now()

      // collected because previous reason like (x-must-collect etc.) or wrong status code
      if (_statusCode > 399) {
        mustCollectStore[requestId] = consts.MUST_COLLECT.ERROR
      }

      /* Service name may be unavailable due to uninitialized reporter */
      var serviceKey = agent.getServiceKey()
      if (isNumber(serviceKey)) {
        debug('trace event (ss); request: %s, x-parent header has been set %s', requestId, serviceKey)
        response.setHeader('x-parent', serviceKey)
      }

      response.setHeader('x-server-send', serverSendTime)
      response.setHeader('x-server-receive', serverReceiveTime)

      if (spanId) {
        debug('trace event (ss); request: %s, x-span-id header has been set to: %s', requestId, spanId)

        response.setHeader('x-span-id', spanId)
      }

      if (mustCollectStore[requestId]) {
        debug('trace event (ss); request: %s x-must-collect header has been set', requestId)
        response.setHeader('x-must-collect', consts.MUST_COLLECT.ERROR)
      }

      originalWriteHead.apply(response, arguments)
    }

    function addSession () {
      agent.setTransactionId(requestId)
      return listener.apply(this, arguments)
    }

    return agent.bind(addSession).apply(this, arguments)
  }
}

module.exports = wrapListener
