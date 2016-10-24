var os = require('os')
var gc = require('../../../optionalDependencies/gc-stats')()
var eventLoopStats = require('../../../optionalDependencies/event-loop-stats')
var inherits = require('util').inherits
var Agent = require('../../agent')

var BYTES_TO_MEGABYTES = 1024 * 1024
var NANO_TO_MILLI = 1000 * 1000

function ApmMetrics (options) {
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

  Agent.call(this, 'Metrics/APM', this.collectInterval, this.sendMetrics.bind(this))
}

inherits(ApmMetrics, Agent)

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
    usedUnit: 'MB',
    total: this._bytesToMegaBytes(memory.heapTotal),
    totalUnit: 'MB',
    rss: this._bytesToMegaBytes(memory.rss),
    rssUnit: 'MB'
  }
}

ApmMetrics.prototype.getLoad = function () {
  if (this.config.isRunningInVm) {
    return {
      utilization: null
    }
  }
  return {
    utilization: Math.floor(os.loadavg()[0] * 100 / this.cpuCount),
    utilizationUnit: 'pct'
  }
}

ApmMetrics.prototype.getGC = function () {
  return {
    time: this._nanoToMilli(this.gc.time),
    timeUnit: 'ms',
    scavenge: this.gc.scavenge,
    scavengeUnit: 'pcs',
    marksweep: this.gc.marksweep,
    marksweepUnit: 'pcs'
  }
}

ApmMetrics.prototype._bytesToMegaBytes = function (bytes) {
  return Math.floor(bytes / BYTES_TO_MEGABYTES)
}

ApmMetrics.prototype._nanoToMilli = function (value) {
  return Math.floor(value / NANO_TO_MILLI)
}

ApmMetrics.prototype.getEventLoop = function () {
  var stats = eventLoopStats.sense()

  var formattedStats = stats && {
    max: stats.max,
    maxUnit: 'ms',
    min: stats.min,
    minUnit: 'ms',
    sum: stats.sum,
    sumUnit: 'ms',
    num: stats.num,
    numUnit: 'pcs'
  }
  return {
    stats: formattedStats,
    requests: process._getActiveRequests().length,
    requestsUnit: 'pcs',
    handlers: process._getActiveHandles().length,
    handlersUnit: 'pcs'
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

module.exports = ApmMetrics
module.exports.create = create
