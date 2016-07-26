var flatMap = require('lodash.flatmap')
var Timer = require('../../timer')

function IncomingEdgeMetrics (options) {
  this.name = 'Metrics/IncomingEdge'
  var _this = this
  this.collectorApi = options.collectorApi
  this.config = options.config
  this.collectInterval = this.config.collectInterval

  // metrics
  this.metrics = {}

  this.timer = new Timer(function () {
    _this.sendMetrics()
  }, this.collectInterval)
}

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
  var serviceKey = data.serviceKey === undefined
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

IncomingEdgeMetrics.prototype.sendMetrics = function () {
  var _this = this

  var metrics = flatMap(Object.keys(this.metrics), function (protocol) {
    return Object.keys(_this.metrics[protocol]).map(function (serviceKey) {
      var items = _this.metrics[protocol][serviceKey]
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
            transportDelay: _this._calculateTimes(items.transportDelay),
            count: items.count
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

  this.collectorApi.sendIncomingEdgeMetrics(metrics)
}

function create (options) {
  return new IncomingEdgeMetrics(options)
}

module.exports.create = create
