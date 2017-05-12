'use strict'
var flatMap = require('lodash.flatmap')
var inherits = require('util').inherits
var Agent = require('../../agent')

function IncomingEdgeMetrics (options) {
  this.collectorApi = options.collectorApi
  this.config = options.config
  this.collectInterval = this.config.collectInterval

  // metrics
  this.metrics = {}

  Agent.call(this, 'Metrics/IncomingEdge', this.collectInterval, this.sendMetrics.bind(this))
}

inherits(IncomingEdgeMetrics, Agent)

IncomingEdgeMetrics.prototype._getEdge = function (protocol, serviceKey) {
  if (!this.metrics[protocol]) {
    this.metrics[protocol] = {}
  }

  if (!this.metrics[protocol][serviceKey]) {
    this.metrics[protocol][serviceKey] = {
      transportDelay: [],
      count: 0
    }
  }

  return this.metrics[protocol][serviceKey]
}

IncomingEdgeMetrics.prototype.report = function (data) {
  // the transportDelay can be negative in some edge-cases:
  // * system clocks are out of sync
  // * ran locally with clock issues
  if (data.transportDelay < 0) {
    return
  }
  var serviceKey = data.serviceKey == null
    ? 'root' : data.serviceKey
  var edge = this._getEdge(data.protocol, serviceKey)

  edge.transportDelay.push(data.transportDelay)
  ++edge.count
}

IncomingEdgeMetrics.prototype._calculateTimes = function (items) {
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

IncomingEdgeMetrics.prototype.sendMetrics = function (callback) {
  var self = this
  callback = callback || function () {}

  var metrics = flatMap(Object.keys(this.metrics), function (protocol) {
    return Object.keys(self.metrics[protocol]).map(function (serviceKey) {
      var items = self.metrics[protocol][serviceKey]
      if (serviceKey === 'root') {
        return {
          protocol: protocol,
          metrics: {
            count: items.count
          }
        }
      } else {
        return {
          protocol: protocol,
          serviceKey: serviceKey,
          metrics: {
            transportDelay: self._calculateTimes(items.transportDelay),
            count: items.count
          }
        }
      }
    })
  })

  this.metrics = {}

  // if no metrics, don't send anything
  if (!metrics || !metrics.length) {
    return callback()
  }

  this.collectorApi.sendIncomingEdgeMetrics(metrics, callback)
}

IncomingEdgeMetrics.prototype.EDGE_STATUS = {
  OK: 0,
  NOT_OK: 1
}

IncomingEdgeMetrics.prototype.stop = function (callback) {
  Agent.prototype.stop.call(this)
  this.sendMetrics(callback)
}

function create (options) {
  return new IncomingEdgeMetrics(options)
}

module.exports = IncomingEdgeMetrics
module.exports.create = create
