var Timer = require('../timer')

function Healthcheck (options) {
  this.name = 'Healthcheck'
  var _this = this
  this.collectorApi = options.collectorApi
  this.config = options.config
  this.healthcheckInterval = this.config.healthcheckInterval

  this.timer = new Timer(function () {
    _this.ping()
  }, this.healthcheckInterval)
}

Healthcheck.prototype.ping = function () {
  this.collectorApi.ping()
}

function create (options) {
  return new Healthcheck(options)
}

module.exports.create = create
