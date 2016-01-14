var url = require('url')

var qs = require('qs')
var uuid = require('node-uuid')
var microtime = require('microtime')
var some = require('lodash/collection/some')
var debug = require('debug')('risingstack/trace')

var getNamespace = require('continuation-local-storage').getNamespace

var Collector = require('../')

function wrapListener (listener, collector, config, mustCollectStore) {
  var ignoreHeaders = config.ignoreHeaders

  return function (request, response) {
    var session = getNamespace('trace')
    var serverRecieveTime

    var headers = request.headers

    var skipped = some(ignoreHeaders, function (value, key) {
      return headers[key] && (value.indexOf('*') > -1 || value.indexOf(headers[key]) > -1)
    })

    if (skipped) {
      return listener.apply(this, arguments)
    }

    var requestUrl = url.parse(request.url)
    var requestQuery = qs.parse(requestUrl.query).requestId
    var originalWriteHead = response.writeHead

    var requestId = headers['request-id'] || requestQuery || uuid.v1()

    // must be collected
    if (headers['x-must-collect']) {
      mustCollectStore[requestId] = true
    }

    var method = request.method
    serverRecieveTime = microtime.now()

    var collectorDataBag = {
      id: requestId,
      host: headers.host,
      url: requestUrl.pathname,
      time: serverRecieveTime,
      method: method,
      headers: headers
    }

    // Collect request start
    process.nextTick(function () {
      collector.emit(Collector.SERVER_RECV, collectorDataBag)
    })

    var serverSendTime
    /*
     * @method instrumentedFinish
     */
    function instrumentedFinish () {
      var responseTime = serverSendTime - serverRecieveTime

      var collectorDataBag = {
        mustCollect: mustCollectStore[requestId],
        id: requestId,
        host: headers.host,
        url: requestUrl.pathname,
        time: serverSendTime,
        headers: headers,
        statusCode: response.statusCode,
        responseTime: responseTime
      }

      // Collect request ended
      process.nextTick(function () {
        collector.emit(Collector.SERVER_SEND, collectorDataBag)
        delete mustCollectStore[requestId]
      })
    }

    response.once('finish', instrumentedFinish)

    response.writeHead = function () {
      serverSendTime = microtime.now()

      // collected because previous reason like (x-must-collect etc.) or wrong status code
      mustCollectStore[requestId] = mustCollectStore[requestId] || response.statusCode > 399

      /* Service name may be unavailable due to uninitialized reporter */
      var serviceName = collector.getService()
      if (serviceName) {
        debug('x-parent header has been set', serviceName)
        response.setHeader('x-parent', serviceName)
      }

      response.setHeader('x-client-send', serverSendTime)

      var spanId = headers['x-span-id']
      if (spanId) {
        debug('x-span-id header has been set to: ', spanId)
        response.setHeader('x-span-id', spanId)
      }

      if (mustCollectStore[requestId]) {
        debug('x-must-collect header has been set')
        response.setHeader('x-must-collect', 1)
      }

      originalWriteHead.apply(response, arguments)
    }

    function addSession () {
      session.set('request-id', requestId)
      return listener.apply(this, arguments)
    }

    return session.bind(addSession).apply(this, arguments)
  }
}

module.exports = wrapListener
