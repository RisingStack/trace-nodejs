var os = require('os')
var fs = require('fs')

var debug = require('debug')('risingstack/trace')

var heapdump = require('../../../optionalDependencies/heapdump')

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
  var tempdir = os.tmpdir()
  var now = Date.now()
  var heapSnapshotName = now + '.heapsnapshot'
  var snapshotPath = tempdir + '/' + heapSnapshotName
  heapdump.writeSnapshot(snapshotPath, function (err) {
    if (err) {
      return debug('Error writing the heapsnapshot', err)
    }

    fs.readFile(snapshotPath, 'utf-8', function (err, data) {
      if (err) {
        return debug('Error reading the heapsnapshot', err)
      }

      _this.collectorApi.sendMemorySnapshot({
        heapSnapshot: data,
        time: now
      })
    })
  })
}

function create (options) {
  return new MemoryProfiler(options)
}

module.exports.create = create
