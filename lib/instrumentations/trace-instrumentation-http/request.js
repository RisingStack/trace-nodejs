'use strict'
var debug = require('../../utils/debug')('instrumentation')
var url = require('url')
var microtime = require('../../optionalDependencies/@risingstack/microtime')

var util = require('./util')
var format = require('util').format

function tryParseInt (string) {
  if (!string) { return }
  var n = parseInt(string, 10)
  return isNaN(n) ? undefined : n
}

function httpClient (originalHttpRequest, agent) {
  var whiteListHosts = agent.getConfig().whiteListHosts
  var config = agent.getConfig()
  var keepQueryParams = config.keepQueryParams

  return function wrappedRequest (requestParams) {
    var collector = agent.tracer.collector
    var externalEdgeMetrics = agent.externalEdgeMetrics

    // parse request
    if (typeof requestParams === 'string') {
      var parsedParams = url.parse(requestParams)
      if (!parsedParams.hostname) {
        return originalHttpRequest.apply(this, arguments)
      } else {
        requestParams = parsedParams
      }
    }

    if (typeof requestParams !== 'object') {
      return originalHttpRequest.apply(this, arguments)
    }

    requestParams.method = (requestParams.method || 'GET').toUpperCase()
    requestParams.host = requestParams.host || requestParams.hostname || 'localhost'
    requestParams.path = requestParams.path || '/'

    // call original and do not collect
    if (whiteListHosts.indexOf(requestParams.host) > -1) {
      return originalHttpRequest.apply(this, arguments)
    }

    var resource
    if (keepQueryParams) {
      resource = util.formatDataUrl(requestParams.path)
    } else {
      var i = requestParams.path.indexOf('?')
      if (i >= 0) {
        resource = requestParams.path.substring(0, i)
      } else {
        resource = requestParams.path
      }
    }

    var cs = collector.clientSend({
      protocol: 'http',
      host: requestParams.host,
      resource: resource,
      action: requestParams.method,
      severity: collector.defaultSeverity
    })

    var event = cs.event

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

    debug.info('httpClient', format('CS(%s) [%s %s %s %s] [must-collect: %s]',
      event.p, 'http', requestParams.method, resource,
      requestParams.host, mustCollect))

    var emitter = originalHttpRequest.apply(this, arguments)

    // returns with error
    var onError = function (err) {
      debug.info('httpClient',
        format('NE(%s) [%s]', event.p, err.code))
      collector.networkError(err, cs.briefcase)
    }

    // returns with response
    var onResponse = function (incomingMessage) {
      var severity = (incomingMessage.headers['x-must-collect'] || incomingMessage.statusCode > 399)
        ? collector.mustCollectSeverity
        : collector.defaultSeverity

      var ssTimestamp = tryParseInt(incomingMessage.headers['x-server-send'])
      var serviceKey = tryParseInt(incomingMessage.headers['x-parent'])

      var duffelBag = {
        severity: severity,
        timestamp: ssTimestamp,
        targetServiceKey: serviceKey
      }

      var status = incomingMessage.statusCode > 399 ? 'bad' : 'ok'

      debug.info('httpClient', format('CR(%s) [%s %s %s] [severity: %s]', event.p,
        'http', status, incomingMessage.statusCode, severity))

      collector.clientRecv({
        protocol: 'http',
        status: status,
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
    }

    return collector.bindToHistory(cs.briefcase, function () {
      collector.bindEmitter(emitter)
      // cls.bindEmitter tries to avoid wrapping. It will only wrap
      // context if either the handler is registered or the emit method
      // is called in context. this means that these two handlers will be
      // in context, but user registered handlers later on won't.
      // If that functionality is needed here later, use emitter-listener
      emitter.on('error', onError)
      emitter.on('response', onResponse)
      return emitter
    }).apply(this, arguments)
  }
}

module.exports = httpClient
