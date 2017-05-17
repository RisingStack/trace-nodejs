'use strict'
var microtime = require('../../optionalDependencies/@risingstack/microtime')
var debug = require('../../utils/debug')('instrumentation')
var Shimmer = require('../../utils/shimmer')

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

function tryParseInt (string) {
  if (!string) { return }
  var n = parseInt(string, 10)
  return isNaN(n) ? undefined : n
}

function httpServer (listener, agent) {
  var config = agent.getConfig()
  var collector = agent.tracer.collector
  var incomingEdgeMetrics = agent.incomingEdgeMetrics
  var ignoreHeaders = config.ignoreHeaders
  var ignorePaths = config.ignorePaths
  var ignoreStatusCodes = config.ignoreStatusCodes
  var keepQueryParams = config.keepQueryParams

  return function (request, response) {
    var resource
    var requestUrl = request.url
    if (keepQueryParams) {
      resource = util.formatDataUrl(requestUrl)
    } else {
      resource = request.url.split('?')[0]
    }

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

    var parentServiceKey = tryParseInt(headers['x-parent'])
    var timestamp = tryParseInt(headers['x-client-send'])
    var communicationId = headers['x-span-id'] || undefined

    var duffelBag = {
      severity: severity,
      transactionId: requestId,
      parentServiceKey: parentServiceKey,
      timestamp: timestamp,
      communicationId: communicationId
    }

    var payload = {
      protocol: 'http',
      host: headers.host,
      action: request.method,
      resource: resource
    }

    incomingEdgeMetrics.report({
      serviceKey: parentServiceKey,
      protocol: 'http',
      transportDelay: timestamp != null ? srTime - timestamp : undefined
    })

    var writeHeadAlreadyCalled = false
    var alreadyEnded = false // currently there is no start, SR acts as an end

    var sr = collector.serverRecv(payload, duffelBag)

    response.on('finish', function () {
      if (!alreadyEnded) {
        collector.end(sr.briefcase)
      }
    })
    response.on('close', function () {
      if (!alreadyEnded) {
        collector.end(sr.briefcase)
      }
    })

    Shimmer.wrap(response, 'writeHead', function wrapWriteHead (original, name) {
      return function onWriteHead () {
        if (writeHeadAlreadyCalled === false) {
          alreadyEnded = true
          writeHeadAlreadyCalled = true
          var ssTime = microtime.now()
          var statusCode = arguments[0] || response.statusCode
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
          }, sr.briefcase, { skip: skipCollecting })

          var mustCollect = collector.LEVELS.gte(ss.duffelBag.severity, collector.mustCollectSeverity)

          debug.info('httpServer', format('SS(%s) [%s %s %s] [must-collect: %s]',
            sr.p, 'http', status, statusCode,
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
            debug.warn('httpServer', '[Warning] failed to create SS, cannot intrument headers')
          }
          agent.rpmMetrics.addResponseTime(ssTime - srTime)
          agent.rpmMetrics.addStatusCode(statusCode)
        } else {
          debug.warn('httpServer', 'writeHead called multiple times, wrongly reported status codes may occur')
        }
        return original.apply(response, arguments)
      }
    })

    var srEvent = sr.event
    debug.info('httpServer', format('SR(%s) [%s %s %s %s] [must-collect: %s]',
      srEvent.p, srEvent.c, srEvent.ac,
      srEvent.e, srEvent.h, !!headers['x-must-collect']))

    return collector.bindToHistory(sr.briefcase, listener).apply(this, arguments)
  }
}

module.exports = httpServer
