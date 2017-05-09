'use strict'
var debug = require('../../../utils/debug')('agent:profiler:cpu')
var format = require('util').format
var inherits = require('util').inherits
var Agent = require('../../agent')

var v8profiler = require('../../../optionalDependencies/@risingstack/v8-profiler')

function CpuProfiler (options) {
  var self = this
  this.collectorApi = options.collectorApi
  this.controlBus = options.controlBus
  this.profileWindow = options.config.profilerWindowLength

  this.controlBus.on('cpu-profile', function (command) {
    self.sendProfile(command)
  })

  Agent.call(this, 'Profiler/CPU')
}

inherits(CpuProfiler, Agent)

CpuProfiler.prototype.sendProfile = function (command) {
  var self = this

  v8profiler.startProfiling('trace-cpu-profile', true)

  setTimeout(function () {
    var profile = v8profiler.stopProfiling('trace-cpu-profile')

    // if the v8-profiler cannot be compiled, we won't have a profile
    profile && profile.export(function (err, result) {
      if (err) {
        return debug.warn('sendProfile', format('no profile: %s', err))
      }

      self.collectorApi.sendCpuProfile({
        cpuProfile: result,
        time: Date.now(),
        commandId: command.id
      }, function () {
        profile.delete()
      })
    })
  }, this.profileWindow)
}

function create (options) {
  return new CpuProfiler(options)
}

module.exports.create = create
