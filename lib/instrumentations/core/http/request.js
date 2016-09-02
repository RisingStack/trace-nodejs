var debug = require('debug')('risingstack/trace:agent:instrumentations')
var url = require('url')
var microtime = require('../../../optionalDependencies/microtime')

var util = require('./util')
var format = require('util').format

function httpClient (originalHttpRequest, agent) {
  var whiteListHosts = agent.getConfig().whiteListHosts

  return function wrappedRequest (requestParams) {
    var collector = agent.tracer.collector
    var externalEdgeMetrics = agent.externalEdgeMetrics
    var briefcase = agent.storage.get('tracer.briefcase')
    var communication = briefcase && briefcase.communication
    var severity = briefcase && briefcase.severity

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

    var cs = collector.clientSend({
      protocol: 'http',
      host: requestParams.host,
      resource: util.formatDataUrl(requestParams.path),
      action: requestParams.method
    }, {
      communication: communication,
      severity: severity
    })

    var csCtx = cs.briefcase.csCtx

    // decorate headers
    requestParams.headers = requestParams.headers || {}

    if (cs.duffelBag.transactionId) {
      requestParams.headers['request-id'] = cs.duffelBag.transactionId
    }

    var mustCollect = collector.LEVELS.gte(cs.duffelBag.severity, collector.mustCollectSeverity)

    if (mustCollect) {
      requestParams.headers['x-must-collect'] = '1'
    }

    if (cs.duffelBag.parentServiceKey != null) {
      requestParams.headers['x-parent'] =
        String(cs.duffelBag.parentServiceKey)
    }

    requestParams.headers['x-client-send'] = String(cs.duffelBag.timestamp)
    requestParams.headers['x-span-id'] = cs.duffelBag.communicationId

    debug('#httpClient', format('CS(%s) [must-collect: %s]', csCtx.communicationId, mustCollect))

    var returned = originalHttpRequest.apply(this, arguments)

    // returns with error
    returned.on('error', function (err) {
      debug('#httpClient', format('CS(%s) network error: %s', csCtx.communicationId, err.code))
      collector.networkError(cs.briefcase, err)
    })

    // returns with response
    returned.on('response', function (incomingMessage) {
      var severity = (incomingMessage.headers['x-must-collect'] || incomingMessage.statusCode > 399)
        ? collector.mustCollectSeverity
        : collector.defaultSeverity

      var ssTimestamp = incomingMessage.headers['x-server-send']
        ? Number(incomingMessage.headers['x-server-send']) : undefined
      var serviceKey = incomingMessage.headers['x-parent']
        ? Number(incomingMessage.headers['x-parent']) : undefined

      var duffelBag = {
        severity: severity,
        timestamp: ssTimestamp,
        targetServiceKey: serviceKey
      }

      debug('#httpClient', format('CR(%s) [severity: %s]', csCtx.communicationId, severity))

      collector.clientRecv({
        protocol: 'http',
        status: incomingMessage.statusCode > 399 ? 'bad' : 'ok',
        data: {
          statusCode: incomingMessage.statusCode
        }
      }, duffelBag, cs.briefcase)

      if (serviceKey == null &&
        ssTimestamp == null &&
        incomingMessage.headers['x-span-id'] == null &&
        incomingMessage.statusCode < 500) {
        externalEdgeMetrics.report({
          targetHost: requestParams.host,
          protocol: 'http',
          status: incomingMessage.statusCode > 399
            ? externalEdgeMetrics.EDGE_STATUS.NOT_OK
            : externalEdgeMetrics.EDGE_STATUS.OK,
          responseTime: microtime.now() - cs.duffelBag.timestamp
        })
      }
    })

    agent.storage.bind(returned)

    return returned
  }
}

module.exports = httpClient
