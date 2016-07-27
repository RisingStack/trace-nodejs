var Timer = require('../../timer')

function RpmMetrics (options) {
  this.name = 'Metrics/RPM'
  var _this = this
  this.collectorApi = options.collectorApi
  this.config = options.config
  this.collectInterval = this.config.collectInterval

  // metrics
  this.rpmMetrics = {}
  this.responseTimes = []
  this.totalRequestCount = 0

  this.timer = new Timer(function () {
    _this.sendMetrics()
  }, this.collectInterval)
}

RpmMetrics.prototype.sendMetrics = function () {
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

    this.collectorApi.sendRpmMetrics(dataBag)
    this.rpmMetrics = {}
    this.responseTimes = []
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

function create (options) {
  return new RpmMetrics(options)
}

module.exports.create = create
