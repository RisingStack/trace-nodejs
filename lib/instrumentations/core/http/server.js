var url = require('url')

var qs = require('qs')
var microtime = require('../../../optionalDependencies/microtime')
var isNumber = require('lodash.isnumber')
var debug = require('debug')('risingstack/trace')

var util = require('./util')
var consts = require('../../../consts')

function wrapListener (listener, agent, mustCollectStore) {
  var ignoreHeaders = agent.getConfig().ignoreHeaders

  return function (request, response) {
    var serverRecieveTime

    var headers = request.headers
    var spanId = headers['x-span-id']

    var skipped = ignoreHeaders && Object.keys(ignoreHeaders).some(function (key) {
      return headers[key] && (ignoreHeaders[key].indexOf('*') > -1 || ignoreHeaders[key].indexOf(headers[key]) > -1)
    })

    if (skipped) {
      debug('trace event (sr); request skipped because of ignoreHeaders', headers)
      return listener.apply(this, arguments)
    }

    var requestUrl = url.parse(request.url)
    var requestQuery = qs.parse(requestUrl.query).requestId

    var originalWriteHead = response.writeHead

    var requestId = headers['request-id'] || requestQuery || agent.generateId()

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
    serverRecieveTime = microtime.now()

    var collectorDataBag = {
      id: requestId,
      spanId: spanId,
      host: headers.host,
      url: util.formatDataUrl(requestUrl.pathname),
      time: serverRecieveTime,
      method: method,
      protocol: consts.PROTOCOLS.HTTP,
      parentId: headers['x-parent'],
      originTime: headers['x-client-send']
    }

    // Collect request start
    agent.serverReceive(collectorDataBag)

    var serverSendTime
    /*
     * @method instrumentedFinish
     */
    function instrumentedFinish () {
      var responseTime = serverSendTime - serverRecieveTime

      var collectorDataBag = {
        mustCollect: mustCollectStore[requestId],
        id: requestId,
        spanId: headers['x-span-id'],
        host: headers.host,
        url: util.formatDataUrl(requestUrl.pathname),
        time: serverSendTime,
        protocol: consts.PROTOCOLS.HTTP,
        statusCode: response.statusCode,
        responseTime: responseTime
      }

      // Collect request ended
      debug('trace event (ss); request: %s, request finished', requestId)
      agent.serverSend(collectorDataBag)
      delete mustCollectStore[requestId]
    }

    response.once('finish', instrumentedFinish)

    response.writeHead = function () {
      serverSendTime = microtime.now()

      // collected because previous reason like (x-must-collect etc.) or wrong status code
      if (response.statusCode > 399) {
        mustCollectStore[requestId] = consts.MUST_COLLECT.ERROR
      }

      /* Service name may be unavailable due to uninitialized reporter */
      var serviceKey = agent.getServiceKey()
      if (isNumber(serviceKey)) {
        debug('trace event (ss); request: %s, x-parent header has been set %s', requestId, serviceKey)
        response.setHeader('x-parent', serviceKey)
      }

      response.setHeader('x-server-send', serverSendTime)
      response.setHeader('x-server-receive', serverRecieveTime)

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
