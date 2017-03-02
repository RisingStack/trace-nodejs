'use strict'
var debug = require('../../../utils/debug')('agent:profiler:memory')
var format = require('util').format
var inherits = require('util').inherits
var Agent = require('../../agent')

var v8profiler = require('../../../optionalDependencies/@risingstack/v8-profiler')

function MemoryProfiler (options) {
  var self = this
  this.name = 'Profiler/Memory'
  this.collectorApi = options.collectorApi
  this.controlBus = options.controlBus

  this.controlBus.on('memory-heapdump', function (command) {
    self.sendSnapshot(command)
  })

  Agent.call(this, 'Profiler/Memory')
}

inherits(MemoryProfiler, Agent)

MemoryProfiler.prototype.sendSnapshot = function (command, callback) {
  var self = this
  var now = Date.now()
  var snapshot = v8profiler.takeSnapshot()

  snapshot && snapshot.export(function (error, result) {
    if (error) {
      return debug.warn('sendSnapshot', format('no profile: %s', error))
    }

    self.collectorApi.sendMemorySnapshot({
      heapSnapshot: result,
      time: now,
      commandId: command.id
    }, function () {
      snapshot.delete()
    })
  })
}

function create (options) {
  return new MemoryProfiler(options)
}

module.exports.create = create
