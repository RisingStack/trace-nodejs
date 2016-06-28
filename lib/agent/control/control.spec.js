var expect = require('chai').expect

var Control = require('./')

describe('The Control module', function () {
  it('interprets commands', function () {
    var collectorApi = {
      getUpdates: function (options, cb) {
        cb(null, {
          commands: [{
            id: 123,
            command: 'memory-heapdump'
          }]
        })
      }
    }

    var controlBus = {
      on: function () {

      },
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
    expect(controlBus.emit).to.be.calledWith('memory-heapdump', undefined)
  })
})
