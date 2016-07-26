'use strict'

function Timer (task, interval) {
  this._handle = undefined
  this.task = task
  this._interval = interval
}

Timer.prototype.start = function (interval) {
  if (interval != null) {
    this._interval = interval
  }
  if (this._handle == null) {
    this._handle = setInterval(this.task, this._interval)
  }
}

Timer.prototype.end = function () {
  if (this._handle != null) {
    clearInterval(this._handle)
    this._handle = undefined
  }
}

Timer.prototype.restart = function (interval) {
  if (interval != null) {
    this._interval = interval
  }
  if (this._handle != null) {
    clearInterval(this._handle)
    this._handle = setInterval(this.task, this._interval)
  }
}

module.exports = Timer
