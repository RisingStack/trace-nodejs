'use strict'
var Timer = require('./timer')

function Agent (name, interval, task) {
  this.name = name
  if (interval != null && typeof task === 'function') {
    this.timer = new Timer(function () {
      task()
    }, interval)
  }
}

Agent.prototype.start = function () {
  if (this.timer) {
    this.timer.start()
  }
}

Agent.prototype.stop = function (callback) {
  if (this.timer) {
    this.timer.end()
  }

  if (callback) {
    process.nextTick(callback)
  }
}

Agent.prototype.initialize = function () { }

Agent.prototype.destruct = function (callback) { this.stop(callback) }

module.exports = Agent
