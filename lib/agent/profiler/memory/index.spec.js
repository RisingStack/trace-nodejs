var expect = require('chai').expect
var EventEmitter = require('events').EventEmitter

var v8profiler = require('../../../optionalDependencies/v8-profiler')

var MemoryProfiler = require('./')

describe('The Memory Profiler module', function () {
  it('sends heapdump', function () {
    var msgBus = new EventEmitter()
    var collectorApi = {
      sendMemorySnapshot: this.sandbox.spy()
    }
    var deleteSnapshotSpy = this.sandbox.spy()
    var snapshotContent = 'snapshot'
    var now = 1234
    var command = {
      id: 42
    }
    var profiler = MemoryProfiler.create({
      collectorApi: collectorApi,
      controlBus: msgBus
    })

    this.sandbox.stub(v8profiler, 'takeSnapshot', function () {
      return {
        export: function (cb) {
          cb(null, snapshotContent)
        },
        delete: deleteSnapshotSpy
      }
    })

    this.sandbox.stub(Date, 'now', function () {
      return now
    })

    profiler.sendSnapshot(command)

    expect(collectorApi.sendMemorySnapshot).to.be.calledWith({
      heapSnapshot: snapshotContent,
      time: now,
      commandId: command.id
    })
    expect(deleteSnapshotSpy).to.be.called
  })
})
