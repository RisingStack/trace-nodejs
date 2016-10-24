var debug = require('debug')('risingstack/trace')

var inherits = require('util').inherits
var Agent = require('../agent')

function Control (options) {
  this.collectorApi = options.collectorApi
  this.controlBus = options.controlBus
  this.config = options.config
  this.updateInterval = this.config.updateInterval

  this.latestCommandId = undefined

  this.getUpdates()

  Agent.call(this, 'Control', this.updateInterval, this.getUpdates.bind(this))
}

inherits(Control, Agent)

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
