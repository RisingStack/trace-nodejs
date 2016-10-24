var microtime = require('../../../optionalDependencies/microtime')
var debug = require('debug')('risingstack/trace')
var Shimmer = require('../../../utils/shimmer')

var util = require('./util')

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

function wrapListener (listener, agent) {
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
      debug('trace event (sr); request skipped because of ignore options', headers)
      return listener.apply(this, arguments)
    }

    var srTime = microtime.now()

    var requestId = headers['request-id'] || headers['x-request-id']

    var severity = headers['x-must-collect']
      ? collector.mustCollectSeverity
      : collector.defaultSeverity

    var parentServiceKey = headers['x-parent'] && Number(headers['x-parent'])
    var timestamp = headers['x-client-send'] && Number(headers['x-client-send'])

    var duffelBag = {
      severity: severity,
      transactionId: requestId,
      parentServiceKey: parentServiceKey,
      timestamp: timestamp
    }

    var payload = {
      host: headers.host,
      action: request.method,
      resource: util.formatDataUrl(requestUrl),
      protocol: 'http'
    }

    var sr = collector.serverRecv(payload, duffelBag, { cacheMode: collector.CACHE_MODES.RETAIN_UNTIL_SS })

    incomingEdgeMetrics.report({
      serviceKey: parentServiceKey,
      protocol: 'http',
      transportDelay: timestamp != null ? srTime - timestamp : undefined
    })

    response.on('finish', function () {
      collector.end(sr.briefcase)
    })
    response.on('close', function () {
      collector.end(sr.briefcase)
    })

    var writeHeadWrapped = false
    Shimmer.wrap(response, 'writeHead', function wrapWriteHead (original, name) {
      return function onWriteHead () {
        if (writeHeadWrapped === false) {
          var ssTime = microtime.now()
          var statusCode = response.statusCode || arguments[0]
          var tracerBriefcase = agent.storage.get('tracer.briefcase')
          var skipCollecting = isStatusCodeIgnored(ignoreStatusCodes, statusCode)
          var ss = collector.serverSend({
            protocol: 'http',
            status: statusCode >= 400 ? 'bad' : 'ok',
            data: {
              statusCode: statusCode
            }
          }, tracerBriefcase, { skip: skipCollecting })
          if (!ss.error) {
            if (ss.duffelBag.targetServiceKey != null) {
              response.setHeader('x-parent', String(ss.duffelBag.targetServiceKey))
            }
            if (ss.duffelBag.timestamp != null) {
              response.setHeader('x-server-send', String(ss.duffelBag.timestamp))
            }
            if (collector.LEVELS.gte(ss.duffelBag.severity, collector.mustCollectSeverity)) {
              response.setHeader('x-must-collect', '1')
            }
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

module.exports = wrapListener
