var expect = require('chai').expect
var os = require('os')
var fs = require('fs')
var EventEmitter = require('events').EventEmitter

var heapdump = require('../../../optionalDependencies/heapdump')

var MemoryProfiler = require('./')

describe('The Memory Profiler module', function () {
  it('sends heapdump', function () {
    var msgBus = new EventEmitter()
    var collectorApi = {
      sendMemorySnapshot: this.sandbox.spy()
    }

    var snapShotContent = 'very-snapshot'
    var now = 1234

    var profiler = MemoryProfiler.create({
      collectorApi: collectorApi,
      controlBus: msgBus
    })

    this.sandbox.stub(heapdump, 'writeSnapshot', function (path, cb) {
      cb()
    })

    this.sandbox.stub(Date, 'now', function () {
      return now
    })

    this.sandbox.stub(fs, 'readFile', function (path, encoding, cb) {
      cb(null, snapShotContent)
    })

    profiler.sendSnapshot()

    expect(collectorApi.sendMemorySnapshot).to.be.calledWith({
      heapSnapshot: snapShotContent,
      time: now
    })
  })
})
