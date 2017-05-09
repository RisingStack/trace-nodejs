'use strict'
var expect = require('chai').expect
var EventEmitter = require('events').EventEmitter

var v8profiler = require('../../../optionalDependencies/@risingstack/v8-profiler')
var CpuProfiler = require('./')

describe('The Cpu Profiler module', function () {
  it('sends profile', function (done) {
    var msgBus = new EventEmitter()
    var profileData = 'some-profile-data'
    var collectorApi = {
      sendCpuProfile: this.sandbox.spy(function (data, callback) {
        callback()
      })
    }

    var profile = {
      export: function (cb) {
        cb(null, profileData)
      },
      delete: this.sandbox.spy()
    }
    var command = {
      id: 42
    }

    var startProfilingStub = this.sandbox.stub(v8profiler, 'startProfiling').callsFake(function () {})
    var stopProfilingStub = this.sandbox.stub(v8profiler, 'stopProfiling').callsFake(function () {
      return profile
    })

    var now = 1234

    var profiler = CpuProfiler.create({
      collectorApi: collectorApi,
      controlBus: msgBus,
      config: {}
    })

    profiler.profileWindow = 0

    this.sandbox.stub(Date, 'now').callsFake(function () {
      return now
    })

    profiler.sendProfile(command)

    setTimeout(function () {
      expect(startProfilingStub).to.be.calledWith('trace-cpu-profile', true)
      expect(stopProfilingStub).to.be.calledWith('trace-cpu-profile')
      expect(collectorApi.sendCpuProfile).to.be.calledWith({
        cpuProfile: profileData,
        time: now,
        commandId: command.id
      })
      expect(profile.delete).to.be.called
      done()
    }, 1)
  })
})
