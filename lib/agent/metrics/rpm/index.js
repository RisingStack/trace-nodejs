'use strict'
var inherits = require('util').inherits
var Agent = require('../../agent')

function RpmMetrics (options) {
  this.collectorApi = options.collectorApi
  this.config = options.config
  this.collectInterval = this.config.collectInterval

  // metrics
  this.rpmMetrics = {}
  this.responseTimes = []
  this.totalRequestCount = 0

  Agent.call(this, 'Metrics/RPM', this.collectInterval, this.sendMetrics.bind(this))
}

inherits(RpmMetrics, Agent)

RpmMetrics.prototype.sendMetrics = function (callback) {
  callback = callback || function () {}
  if (Object.keys(this.rpmMetrics).length > 0) {
    this.responseTimes.sort(function (current, next) {
      return current - next
    })

    var medianElementIndex = Math.round(this.responseTimes.length / 2) - 1
    var ninetyFiveElementIndex = Math.round(this.responseTimes.length * 0.95) - 1
    var dataBag = {
      requests: this.rpmMetrics,
      timestamp: new Date().toISOString(),
      median: this.responseTimes[medianElementIndex] || null,
      ninetyFive: this.responseTimes[ninetyFiveElementIndex] || null
    }

    this.collectorApi.sendRpmMetrics(dataBag, callback)
    this.rpmMetrics = {}
    this.responseTimes = []
  } else {
    callback()
  }
}

RpmMetrics.prototype.addResponseTime = function (responseTime) {
  this.responseTimes.push(responseTime)
}

RpmMetrics.prototype.addStatusCode = function (statusCode) {
  if (!this.rpmMetrics[statusCode]) {
    this.rpmMetrics[statusCode] = 1
  } else {
    this.rpmMetrics[statusCode]++
  }
}

RpmMetrics.prototype.stop = function (callback) {
  Agent.prototype.stop.call(this)
  this.sendMetrics(callback)
}

function create (options) {
  return new RpmMetrics(options)
}

module.exports = RpmMetrics
module.exports.create = create
