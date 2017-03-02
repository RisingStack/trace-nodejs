'use strict'
function Timer (task, interval, onEndCb) {
  this._handle = undefined
  this.task = task
  this._interval = interval
  this._onEndCb = onEndCb
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

  if (this._onEndCb) {
    this._onEndCb()
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
