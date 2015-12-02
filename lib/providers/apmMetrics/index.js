var os = require('os')
var usage = require('usage')
var BYTES_TO_MEGABYTES = 1024 * 1024

function ApmMetrics (eventBus) {
  this.pid = process.pid
  this.eventBus = eventBus
  this.collectInterval = process.env.TRACE_COLLECT_INTERVAL || 60 * 1000

  var _this = this

  this.interval = setInterval(function () {
    _this.getMetrics()
  }, this.collectInterval)
}

ApmMetrics.prototype.getMetrics = function () {
  var _this = this
  var loadAvgOneMin

  usage.lookup(this.pid, function (err, results) {
    if (err) {
      return _this.eventBus.emit(_this.eventBus.ERROR, err)
    }

    loadAvgOneMin = os.loadavg()[0]

    _this.eventBus.emit(_this.eventBus.APM_METRICS, {
      timestamp: (new Date()).toISOString(),
      memory: {
        used: _this._bytesToMegaBytes(results.memoryInfo.rss)
      },
      cpu: {
        utilization: Math.floor(loadAvgOneMin)
      }
    })
  })
}

ApmMetrics.prototype._bytesToMegaBytes = function (bytes) {
  return Math.floor(bytes / BYTES_TO_MEGABYTES)
}

function create (eventBus) {
  return new ApmMetrics(eventBus)
}

module.exports.create = create
