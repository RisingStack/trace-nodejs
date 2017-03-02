'use strict'
var expect = require('chai').expect

var Control = require('./')
var Timer = require('../timer')

describe('The Control module', function () {
  it('gets memory-heapdump', function () {
    var command = {
      id: 123,
      command: 'memory-heapdump'
    }
    var collectorApi = {
      getUpdates: function (options, cb) {
        cb(null, {
          commands: [command]
        })
      }
    }

    var controlBus = {
      on: function () {},
      emit: this.sandbox.spy()
    }

    var profiler = Control.create({
      collectorApi: collectorApi,
      controlBus: controlBus,
      config: {
        updateInterval: 1
      }
    })
    profiler.getUpdates()
    expect(controlBus.emit).to.be.calledWith('memory-heapdump', command)
  })
  it('should have a timer', function () {
    var collectorApi = {
      getUpdates: function () { }
    }
    var profiler = Control.create({
      collectorApi: collectorApi,
      config: {
        updateInterval: 1
      }
    })
    expect(profiler.timer).to.be.instanceof(Timer)
  })
})
