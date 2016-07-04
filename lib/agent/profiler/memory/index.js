var debug = require('debug')('risingstack/trace')

var v8profiler = require('../../../optionalDependencies/v8-profiler')

function MemoryProfiler (options) {
  var _this = this
  this.collectorApi = options.collectorApi
  this.controlBus = options.controlBus

  this.controlBus.on('memory-heapdump', function (data) {
    _this.sendSnapshot()
  })
}

MemoryProfiler.prototype.sendSnapshot = function () {
  var _this = this
  var now = Date.now()
  var snapshot = v8profiler.takeSnapshot()

  snapshot && snapshot.export(function (error, result) {
    if (error) {
      return debug(error)
    }

    _this.collectorApi.sendMemorySnapshot({
      heapSnapshot: result,
      time: now
    })

    snapshot.delete()
  })
}

function create (options) {
  return new MemoryProfiler(options)
}

module.exports.create = create
