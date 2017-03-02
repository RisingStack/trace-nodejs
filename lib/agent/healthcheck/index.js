'use strict'
var inherits = require('util').inherits
var Agent = require('../agent')

function Healthcheck (options) {
  this.collectorApi = options.collectorApi
  this.config = options.config
  this.healthcheckInterval = this.config.healthcheckInterval

  Agent.call(this, 'Healthcheck', this.healthcheckInterval, this.ping.bind(this))
}

inherits(Healthcheck, Agent)

Healthcheck.prototype.ping = function () {
  this.collectorApi.ping()
}

function create (options) {
  return new Healthcheck(options)
}

module.exports.create = create
