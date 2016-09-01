var debug = require('debug')('risingstack/trace')

var v8profiler = require('../../../optionalDependencies/v8-profiler')

function CpuProfiler (options) {
  this.name = 'Profiler/CPU'
  var _this = this
  this.collectorApi = options.collectorApi
  this.controlBus = options.controlBus
  this.profileWindow = 10000

  this.controlBus.on('cpu-profile', function (command) {
    _this.sendProfile(command)
  })
}

CpuProfiler.prototype.sendProfile = function (command) {
  var _this = this

  v8profiler.startProfiling('trace-cpu-profile', true)

  setTimeout(function () {
    var profile = v8profiler.stopProfiling('trace-cpu-profile')

    // if the v8-profiler cannot be compiled, we won't have a profile
    profile && profile.export(function (err, result) {
      if (err) {
        return debug(err)
      }

      _this.collectorApi.sendCpuProfile({
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
