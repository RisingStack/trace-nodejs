var debug = require('debug')('risingstack/trace')
var getNamespace = require('continuation-local-storage').getNamespace
var microtime = require('microtime')
var url = require('url')
var uuid = require('node-uuid')

var Collector = require('../')

function wrapRequest (originalHttpRequest, collector, config, mustCollectStore) {
  var whiteListHosts = config.whiteListHosts

  return function wrappedRequest (requestParams) {
    var session = getNamespace('trace')
    var requestId = session.get('request-id') || uuid.v1()
    var clientSendTime = microtime.now()
    var spanId = uuid.v1()
    var collectorDataBag
    var returned

    // parse request
    if (typeof requestParams === 'string') {
      requestParams = url.parse(requestParams)
      requestParams.method = 'GET'
    }

    if (requestParams.hostname) {
      requestParams.host = requestParams.hostname
    }

    // call original and do not collect
    if (whiteListHosts.indexOf(requestParams.host) > -1) {
      return originalHttpRequest.apply(this, arguments)
    }

    debug('trace event (cs); reqId: %s, spanId: %s', requestId, spanId)

    // decorate headers
    requestParams.headers = requestParams.headers || {}

    if (requestId) {
      requestParams.headers['request-id'] = requestId
    }

    if (mustCollectStore[requestId]) {
      debug('trace event (cs); reqId: %s, spanId: %s must collect', requestId, spanId)
      requestParams.headers['x-must-collect'] = '1'
    }

    if (typeof collector.getService() !== 'undefined') {
      requestParams.headers['x-parent'] = String(collector.getService())
    }

    requestParams.headers['x-client-send'] = String(clientSendTime)
    requestParams.headers['x-span-id'] = spanId

    // init data bag for collector
    collectorDataBag = {
      id: requestId,
      host: requestParams.host,
      url: requestParams.path,
      time: clientSendTime,
      headers: requestParams.headers,
      method: requestParams.method,
      mustCollect: !!mustCollectStore[requestId]
    }

    // Collect request start
    collector.emit(Collector.CLIENT_SEND, collectorDataBag)

    /*
     *  CLIENT_RECV
     */

    returned = originalHttpRequest.apply(this, arguments)

    // returns with error
    returned.on('error', function (err) {
      debug('trace event (cr) on error; reqId: %s, spanId: %s must collect', requestId, spanId)

      var collectorDataBag = {
        id: requestId,
        spanId: spanId,
        host: requestParams.host,
        url: requestParams.path,
        time: microtime.now(),
        headers: requestParams.headers,
        mustCollect: true,
        err: {
          type: 'network-error',
          message: err.message,
          raw: {
            code: err.code,
            host: err.host,
            port: err.port,
            syscall: err.syscall
          }
        }
      }

      collector.emit(Collector.CLIENT_RECV, collectorDataBag)
    })

    // returns with response
    returned.on('response', function (incomingMessage) {
      mustCollectStore[requestId] = !!incomingMessage.headers['x-must-collect'] ||
        !!mustCollectStore[requestId]

      if (mustCollectStore[requestId]) {
        debug('trace event (cr) on response; reqId: %s, spanId: %s must collect', requestId, spanId)
      }

      var collectorDataBag = {
        id: requestId,
        spanId: spanId,
        host: requestParams.host,
        url: requestParams.path,
        time: microtime.now(),
        headers: incomingMessage.headers,
        statusCode: incomingMessage.statusCode,
        mustCollect: mustCollectStore[requestId]
      }

      collector.emit(Collector.CLIENT_RECV, collectorDataBag)
    })

    session.bind(returned)

    return returned
  }
}

module.exports = wrapRequest
