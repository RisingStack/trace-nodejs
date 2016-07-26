var os = require('os')
var gc = require('../../../optionalDependencies/gc-stats')()
var eventLoopStats = require('../../../optionalDependencies/event-loop-stats')
var Timer = require('../../timer')

var BYTES_TO_MEGABYTES = 1024 * 1024

function ApmMetrics (options) {
  this.name = 'Metrics/APM'
  var _this = this
  this.cpuCount = os.cpus().length
  this.pid = process.pid
  this.collectorApi = options.collectorApi
  this.config = options.config
  this.lagId = 0
  this.collectInterval = this.config.collectInterval
  this.eventloop = {}
  this.gc = {
    time: 0,
    scavenge: 0,
    marksweep: 0
  }

  gc.on('stats', function (stats) {
    // time is in nanoseconds
    _this.gc.time += stats.pause

    switch (stats.gctype) {
      case 1:
        _this.gc.scavenge += 1
        break
      case 2:
        _this.gc.marksweep += 1
        break
      case 3:
        _this.gc.scavenge += 1
        _this.gc.marksweep += 1
        break
    }
  })

  this.timer = new Timer(function () {
    _this.sendMetrics()
  }, this.collectInterval)
}

ApmMetrics.prototype.sendMetrics = function () {
  var eventloop = this.getEventLoop()
  var gc = this.getGC()

  var databag = {
    timestamp: (new Date()).toISOString(),
    memory: this.getMemory(),
    cpu: this.getLoad()
  }

  if (eventloop.stats) {
    databag.eventloop = eventloop
  }

  if (gc) {
    databag.gc = gc
  }

  this.collectorApi.sendApmMetrics(databag)

  this.reset()
}

ApmMetrics.prototype.getMemory = function () {
  var memory = process.memoryUsage()
  return {
    used: this._bytesToMegaBytes(memory.heapUsed),
    total: this._bytesToMegaBytes(memory.heapTotal),
    rss: this._bytesToMegaBytes(memory.rss)
  }
}

ApmMetrics.prototype.getLoad = function () {
  if (this.config.isRunningInVm) {
    return {
      utilization: null
    }
  }
  return {
    utilization: Math.floor(os.loadavg()[0] * 100 / this.cpuCount)
  }
}

ApmMetrics.prototype.getGC = function () {
  return this.gc
}

ApmMetrics.prototype._bytesToMegaBytes = function (bytes) {
  return Math.floor(bytes / BYTES_TO_MEGABYTES)
}

ApmMetrics.prototype.getEventLoop = function () {
  return {
    stats: eventLoopStats.sense(),
    requests: process._getActiveRequests().length,
    handlers: process._getActiveHandles().length
  }
}

ApmMetrics.prototype.reset = function () {
  this.gc = {
    time: 0,
    scavenge: 0,
    marksweep: 0
  }
}

function create (options) {
  return new ApmMetrics(options)
}

module.exports.create = create
