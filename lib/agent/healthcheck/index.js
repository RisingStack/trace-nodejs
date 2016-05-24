function Healthcheck (options) {
  var _this = this

  this.collectorApi = options.collectorApi
  this.config = options.config
  this.healthcheckInterval = this.config.healthcheckInterval
  this.interval = setInterval(function () {
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
