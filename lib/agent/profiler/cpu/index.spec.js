var expect = require('chai').expect
var EventEmitter = require('events').EventEmitter

var v8profiler = require('../../../optionalDependencies/v8-profiler')
var CpuProfiler = require('./')

describe('The Cpu Profiler module', function () {
  it('sends profile', function (done) {
    var msgBus = new EventEmitter()
    var profileData = 'some-profile-data'
    var collectorApi = {
      sendCpuProfile: this.sandbox.spy()
    }
    var profile = {
      export: function (cb) {
        cb(null, profileData)
      },
      delete: this.sandbox.spy()
    }

    var startProfilingStub = this.sandbox.stub(v8profiler, 'startProfiling', function () {})
    var stopProfilingStub = this.sandbox.stub(v8profiler, 'stopProfiling', function () {
      return profile
    })

    var now = 1234

    var profiler = CpuProfiler.create({
      collectorApi: collectorApi,
      controlBus: msgBus
    })

    profiler.profileWindow = 0

    this.sandbox.stub(Date, 'now', function () {
      return now
    })

    profiler.sendProfile()

    setTimeout(function () {
      expect(startProfilingStub).to.be.calledWith('trace-cpu-profile', true)
      expect(stopProfilingStub).to.be.calledWith('trace-cpu-profile')
      expect(collectorApi.sendCpuProfile).to.be.calledWith({
        cpuProfile: profileData,
        time: now
      })
      expect(profile.delete).to.be.called
      done()
    }, 1)

  })
})
