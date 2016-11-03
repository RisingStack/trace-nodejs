var debug = require('debug')('risingstack/trace')
var url = require('url')
var microtime = require('../../../optionalDependencies/microtime')

var util = require('./util')
var consts = require('../../../consts')

function wrapRequest (originalHttpRequest, agent, mustCollectStore) {
  var whiteListHosts = agent.getConfig().whiteListHosts

  return function wrappedRequest (requestParams) {
    var requestId = agent.getRequestId() || agent.generateRequestId()
    var childCommId = agent.generateCommId()
    var clientSendTime = microtime.now()
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

    debug('trace event (cs); reqId: %s, child commId: %s',
      requestId, childCommId)

    // decorate headers
    requestParams.headers = requestParams.headers || {}

    if (requestId) {
      requestParams.headers['request-id'] = requestId
    }

    if (mustCollectStore[requestId]) {
      debug('trace event (cs); reqId: %s, child commId: %s must collect', requestId, childCommId)
      requestParams.headers['x-must-collect'] = consts.MUST_COLLECT.ERROR
    }

    if (typeof agent.getServiceKey() !== 'undefined') {
      requestParams.headers['x-parent'] = String(agent.getServiceKey())
    }

    requestParams.headers['x-client-send'] = String(clientSendTime)
    requestParams.headers['x-span-id'] = childCommId

    // init data bag for collector
    collectorDataBag = {
      requestId: requestId,
      childCommId: childCommId,
      protocol: consts.PROTOCOLS.HTTP,
      host: requestParams.host,
      url: util.formatDataUrl(requestParams.path),
      time: clientSendTime,
      method: requestParams.method,
      mustCollect: mustCollectStore[requestId]
    }

    // Collect request start
    agent.clientSend(collectorDataBag)
    /*
     *  CLIENT_RECV
     */

    returned = originalHttpRequest.apply(this, arguments)

    // returns with error
    returned.on('error', function (err) {
      debug('trace event (cr) on error; reqId: %s, child commId: %s must collect', requestId, childCommId)

      var collectorDataBag = {
        requestId: requestId,
        childCommId: childCommId,
        host: requestParams.host,
        url: util.formatDataUrl(requestParams.path),
        mustCollect: consts.MUST_COLLECT.ERROR,
        protocol: consts.PROTOCOLS.HTTP,
        status: consts.EDGE_STATUS.NOT_OK,
        err: {
          message: err.message,
          raw: {
            code: err.code,
            host: err.host,
            port: err.port,
            syscall: err.syscall
          }
        }
      }

      agent.clientReceive(collectorDataBag)
    })

    // returns with response
    returned.on('response', function (incomingMessage) {
      var clientReceiveTime = microtime.now()
      var networkDelayIncoming
      var networkDelayOutgoing

      mustCollectStore[requestId] = incomingMessage.headers['x-must-collect'] ||
        mustCollectStore[requestId]

      if (mustCollectStore[requestId]) {
        debug('trace event (cr) on response; reqId: %s, child commId: %s must collect', requestId, childCommId)
      } else {
        debug('trace event (cr) on response; reqId: %s, child commId: %s', requestId, childCommId)
      }

      if (incomingMessage.headers['x-server-send']) {
        networkDelayIncoming = clientReceiveTime - Number(incomingMessage.headers['x-server-send'])
      }

      if (incomingMessage.headers['x-server-receive']) {
        networkDelayOutgoing = Number(incomingMessage.headers['x-server-receive']) - clientSendTime
      }

      var collectorDataBag = {
        requestId: requestId,
        childCommId: childCommId,
        protocol: consts.PROTOCOLS.HTTP,
        protocolData: {
          statusCode: incomingMessage.statusCode
        },
        host: requestParams.host,
        url: util.formatDataUrl(requestParams.path),

        mustCollect: mustCollectStore[requestId],
        targetServiceKey: incomingMessage.headers['x-parent'],
        responseTime: clientReceiveTime - clientSendTime,
        networkDelayIncoming: networkDelayIncoming,
        networkDelayOutgoing: networkDelayOutgoing,
        status: incomingMessage.statusCode > 399 ? consts.EDGE_STATUS.NOT_OK : consts.EDGE_STATUS.OK,
        statusDescription: String(incomingMessage.statusCode)
      }

      agent.clientReceive(collectorDataBag)
    })

    agent.bind(returned)

    return returned
  }
}

module.exports = wrapRequest
