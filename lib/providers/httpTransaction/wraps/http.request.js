var debug = require('debug')('risingstack/trace')
var getNamespace = require('continuation-local-storage').getNamespace
var microtime = require('microtime')
var url = require('url')
var uuid = require('node-uuid')

var Collector = require('../')

function wrapRequest (original, collector, config) {
  var whiteListHosts = config.whiteListHosts

  return function (requestParams) {
    var session = getNamespace('trace')
    var requestId = session.get('request-id')
    var mustCollect = session.get('mustCollect')
    var clientSendTime = microtime.now()
    var spanId = uuid.v1()
    var collectorDataBag
    var returned

    if (typeof requestParams === 'string') {
      requestParams = url.parse(requestParams)
      requestParams.method = 'GET'
    }

    if (requestParams.hostname) {
      requestParams.host = requestParams.hostname
    }

    if (whiteListHosts.indexOf(requestParams.host + ':' + requestParams.port) > -1) {
      return original.apply(this, arguments)
    }

    debug('trace id:', requestId)

    requestParams.headers = requestParams.headers || {}

    if (requestId) {
      requestParams.headers['request-id'] = requestId
    }

    if (mustCollect) {
      requestParams.headers['X-Must-Collect'] = 1
    }

    if (typeof collector.getService() !== 'undefined') {
      requestParams.headers['x-parent'] = collector.getService()
    }

    requestParams.headers['x-client-send'] = clientSendTime

    requestParams.headers['x-span-id'] = spanId

    collectorDataBag = {
      id: requestId,
      host: requestParams.host,
      url: requestParams.path,
      time: clientSendTime,
      headers: requestParams.headers,
      method: requestParams.method,
      mustCollect: mustCollect
    }

    // Collect request start
    process.nextTick(function () {
      collector.emit(Collector.CLIENT_SEND, collectorDataBag)
    })

    /*
     *  CLIENT_RECV
     */

    returned = original.apply(this, arguments)

    returned.on('error', function (err) {
      var collectorDataBag = {
        id: requestId,
        spanId: spanId,
        host: requestParams.host,
        url: requestParams.path,
        time: microtime.now(),
        headers: requestParams.headers,
        err: err
      }

      collector.emit(Collector.CLIENT_RECV, collectorDataBag)
    })

    returned.on('response', function (incomingMessage) {
      var mustCollect = incomingMessage.headers['X-Must-Collect'] || session.get('mustCollect')

      if (mustCollect) {
        session.set('mustCollect', mustCollect)
      }

      var collectorDataBag = {
        id: requestId,
        spanId: spanId,
        host: requestParams.host,
        url: requestParams.path,
        time: microtime.now(),
        headers: incomingMessage.headers,
        statusCode: incomingMessage.statusCode,
        mustCollect: mustCollect
      }

      collector.emit(Collector.CLIENT_RECV, collectorDataBag)
    })

    return returned
  }
}

module.exports = wrapRequest
