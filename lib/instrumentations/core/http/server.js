var microtime = require('../../../optionalDependencies/microtime')
var debug = require('debug')('risingstack/trace:agent:instrumentations')
var Shimmer = require('../../../utils/shimmer')

var util = require('./util')
var format = require('util').format

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

function httpServer (listener, agent) {
  var config = agent.getConfig()
  var collector = agent.tracer.collector
  var incomingEdgeMetrics = agent.incomingEdgeMetrics
  var ignoreHeaders = config.ignoreHeaders
  var ignorePaths = config.ignorePaths
  var ignoreStatusCodes = config.ignoreStatusCodes

  return function (request, response) {
    var requestUrl = request.url.split('?')[0]

    var headers = request.headers

    var isSkippedHeader = ignoreHeaders && Object.keys(ignoreHeaders).some(function (key) {
      return headers[key] && (ignoreHeaders[key].indexOf('*') > -1 || ignoreHeaders[key].indexOf(headers[key]) > -1)
    })

    if (isSkippedHeader || isPathIgnored(ignorePaths, requestUrl)) {
      return listener.apply(this, arguments)
    }

    var srTime = microtime.now()

    var requestId = headers['request-id'] || headers['x-request-id']

    var severity = headers['x-must-collect']
      ? collector.mustCollectSeverity
      : collector.defaultSeverity

    var parentServiceKey = headers['x-parent'] && Number(headers['x-parent'])
    var timestamp = headers['x-client-send'] && Number(headers['x-client-send'])
    var communicationId = headers['x-span-id']

    var duffelBag = {
      severity: severity,
      transactionId: requestId,
      parentServiceKey: parentServiceKey,
      timestamp: timestamp,
      communicationId: communicationId
    }

    var resource = util.formatDataUrl(requestUrl)

    var payload = {
      protocol: 'http',
      host: headers.host,
      action: request.method,
      resource: resource
    }

    var sr = collector.serverRecv(payload, duffelBag)

    debug('#httpServer', format('SR(%s) [%s %s %s %s] [must-collect: %s]',
      sr.briefcase.communication.id, 'http', request.method, resource,
      headers.host, !!headers['x-must-collect']))

    incomingEdgeMetrics.report({
      serviceKey: parentServiceKey,
      protocol: 'http',
      transportDelay: timestamp != null ? srTime - timestamp : undefined
    })

    var writeHeadWrapped = false

    response.on('finish', function () {
      collector.end(sr.briefcase)
    })
    response.on('close', function () {
      collector.end(sr.briefcase)
    })

    Shimmer.wrap(response, 'writeHead', function wrapWriteHead (original, name) {
      return function onWriteHead () {
        if (writeHeadWrapped === false) {
          var ssTime = microtime.now()
          var statusCode = response.statusCode || arguments[0]
          var tracerBriefcase = agent.storage.get('tracer.briefcase')
          if (!tracerBriefcase) {
            debug('#httpServer', '[Warning] lost tracer.briefcase context, falling back to SR briefcase')
            tracerBriefcase = sr.briefcase
          }
          var skipCollecting = isStatusCodeIgnored(ignoreStatusCodes, statusCode)
          var status = statusCode >= 400 ? 'bad' : 'ok'
          var ss = collector.serverSend({
            protocol: 'http',
            status: status,
            data: {
              statusCode: statusCode
            },
            severity: status === 'bad'
              ? collector.mustCollectSeverity
              : collector.defaultSeverity
          }, tracerBriefcase, { skip: skipCollecting })

          var mustCollect = collector.LEVELS.gte(ss.duffelBag.severity, collector.mustCollectSeverity)

          debug('#httpServer', format('SS(%s) [%s %s %s] [must-collect: %s]',
            tracerBriefcase.communication && tracerBriefcase.communication.id, 'http', status, statusCode,
            mustCollect))

          if (!ss.error) {
            if (ss.duffelBag.targetServiceKey != null) {
              response.setHeader('x-parent', String(ss.duffelBag.targetServiceKey))
            }
            if (ss.duffelBag.timestamp != null) {
              response.setHeader('x-server-send', String(ss.duffelBag.timestamp))
            }
            if (mustCollect) {
              response.setHeader('x-must-collect', '1')
            }
          } else {
            debug('#httpServer', '[Warning] failed to create SS, cannot intrument headers')
          }
          agent.rpmMetrics.addResponseTime(ssTime - srTime)
          agent.rpmMetrics.addStatusCode(response.statusCode)
          writeHeadWrapped = true
        }
        return original.apply(response, arguments)
      }
    })

    function session () {
      agent.storage.set('tracer.briefcase', sr.briefcase)
      return listener.apply(this, arguments)
    }

    return agent.storage.bindNew(session).apply(this, arguments)
  }
}

module.exports = httpServer
