var debug = require('debug')('risingstack/trace')

var Timer = require('../timer')

function Control (options) {
  var _this = this
  this.name = 'Control'

  this.collectorApi = options.collectorApi
  this.controlBus = options.controlBus
  this.config = options.config
  this.updateInterval = this.config.updateInterval
  this.latestCommandId = undefined

  this.getUpdates()

  this.timer = new Timer(function () {
    _this.getUpdates()
  }, this.updateInterval)
}

Control.prototype.getUpdates = function () {
  var _this = this
  this.collectorApi.getUpdates({
    latestCommandId: _this.latestCommandId
  }, function (err, result) {
    if (err) {
      return debug(err)
    }

    _this.latestCommandId = result.latestCommandId

    result.commands = result.commands || []
    result.commands.forEach(function (command) {
      _this.controlBus.emit(command.command, command)
    })
  })
}

function create (options) {
  return new Control(options)
}

module.exports.create = create
