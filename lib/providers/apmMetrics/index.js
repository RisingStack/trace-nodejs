var os = require('os')
var blocked = require('blocked')
var gc = (require('gc-stats'))()

var BYTES_TO_MEGABYTES = 1024 * 1024

function ApmMetrics (eventBus) {
  this.pid = process.pid
  this.eventBus = eventBus
  this.lagId = 0
  this.collectInterval = process.env.TRACE_COLLECT_INTERVAL || 60 * 1000
  this.eventloop = {}
  this.gc = {
    time: 0,
    scavenge: 0,
    marksweep: 0
  }
  this.eventLoopLag = {}
  this.eventLoopLag[this.lagId] = []

  var _this = this

  this.interval = setInterval(function () {
    _this.getMetrics()
  }, this.collectInterval)

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

  blocked(function (ms) {
    _this.eventLoopLag[_this.lagId].push(ms)
  })
}

ApmMetrics.prototype.getMetrics = function () {
  this.eventBus.emit(this.eventBus.APM_METRICS, {
    timestamp: (new Date()).toISOString(),
    memory: this.getMemory(),
    cpu: this.getCpu(),
    eventloop: this.getEventLoop(),
    gc: this.getGC()
  })

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

ApmMetrics.prototype.getCpu = function () {
  return {
    utilization: Math.floor(os.loadavg()[0])
  }
}

ApmMetrics.prototype.getGC = function () {
  return this.gc
}

ApmMetrics.prototype._bytesToMegaBytes = function (bytes) {
  return Math.floor(bytes / BYTES_TO_MEGABYTES)
}

ApmMetrics.prototype.getEventLoop = function () {
  this.eventLoopLag[++this.lagId] = []
  if (this.eventLoopLag[this.lagId - 2]) {
    delete this.eventLoopLag[this.lagId - 2]
  }

  var eventLoopLag = this.eventLoopLag[this.lagId - 1].reduce(function (total, curr) {
    return total + curr
  }, 0)

  return {
    lag: eventLoopLag,
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

  this.eventloop = {
    lag: 0,
    requests: 0,
    handlers: 0
  }
}

function create (eventBus) {
  return new ApmMetrics(eventBus)
}

module.exports.create = create
