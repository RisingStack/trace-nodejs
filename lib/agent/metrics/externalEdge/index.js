var debug = require('debug')('risingstack/trace')
var flatMap = require('lodash.flatmap')
var consts = require('../../../consts')

var inherits = require('util').inherits
var Agent = require('../../agent')

function ExternalEdgeMetrics (options) {
  this.collectorApi = options.collectorApi
  this.config = options.config
  this.collectInterval = this.config.collectInterval

  // metrics
  this.metrics = {}

  Agent.call(this, 'Metrics/ExternalEdge', this.collectInterval, this.sendMetrics.bind(this))
}

inherits(ExternalEdgeMetrics, Agent)

ExternalEdgeMetrics.prototype.initHost = function (data) {
  if (!this.metrics[data.protocol][data.targetHost]) {
    this.metrics[data.protocol][data.targetHost] = {
      responseTime: [],
      status: {
        ok: 0,
        notOk: 0
      }
    }
  }
  return this.metrics[data.protocol][data.targetHost]
}

ExternalEdgeMetrics.prototype.initProtocol = function (data) {
  if (!this.metrics[data.protocol]) {
    this.metrics[data.protocol] = {}
  }
  return this.metrics[data.protocol]
}

ExternalEdgeMetrics.prototype.report = function (data) {
  // protect against bad use of the report function: responseTime is required
  // TODO: check all instrumentations to be sure they send a responseTime
  if (!data.responseTime) {
    debug('ExternalEdgeMetrics.report responseTime is undefined, discarding')
    return
  }
  this.initProtocol(data)
  var edge = this.initHost(data)

  edge.responseTime.push(data.responseTime)

  if (data.status === consts.EDGE_STATUS.OK) {
    edge.status.ok += 1
  } else if (data.status === consts.EDGE_STATUS.NOT_OK) {
    edge.status.notOk += 1
  }
}

ExternalEdgeMetrics.prototype.calculateTimes = function (items) {
  var sorted = items.sort(function (a, b) {
    return a - b
  })

  var medianElementIndex = Math.round(sorted.length / 2) - 1
  var ninetyFiveElementIndex = Math.round(sorted.length * 0.95) - 1

  return {
    median: sorted[medianElementIndex],
    ninetyFive: sorted[ninetyFiveElementIndex]
  }
}

ExternalEdgeMetrics.prototype.sendMetrics = function () {
  var _this = this

  var metrics = flatMap(Object.keys(this.metrics), function (protocol) {
    return Object.keys(_this.metrics[protocol]).map(function (hostName) {
      var host = _this.metrics[protocol][hostName]
      return {
        protocol: protocol,
        target: {
          id: hostName
        },
        metrics: {
          responseTime: _this.calculateTimes(host.responseTime),
          status: {
            ok: host.status.ok,
            notOk: host.status.notOk
          }
        }
      }
    })
  })

  this.metrics = {}

  // if no metrics, don't send anything
  if (!metrics || !metrics.length) {
    return
  }

  this.collectorApi.sendExternalEdgeMetrics({
    timestamp: (new Date()).toISOString(),
    data: metrics
  })
}

ExternalEdgeMetrics.prototype.EDGE_STATUS = {
  OK: 0,
  NOT_OK: 1
}

function create (options) {
  return new ExternalEdgeMetrics(options)
}

module.exports = ExternalEdgeMetrics
module.exports.create = create
