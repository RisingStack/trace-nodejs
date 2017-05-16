'use strict'

var inherits = require('util').inherits
var retry = require('async/retry')

var DEFAULT_MAX_RETRIES = Infinity
var DEFAULT_MAX_WAIT = Infinity
var DEFAULT_EXP_SCALE = 1
var DEFAULT_LIN_SCALE = 1
var DEFAULT_TRANS = 0
var DEFAULT_ERR_SCALE = 0
var DEFAULT_ERR_TRANS = 0

function MaxRetriesExceededError (n, last) {
  Error.captureStackTrace && Error.captureStackTrace(this, this.constructor)
  this.message = 'Network request max retry limit reached after ' + n + ' attempts. Last error message was: ' + last.message
  if (this.stack && last.stack) {
    this.stack += '\nCaused by: ' + last.stack
  }
}
inherits(MaxRetriesExceededError, Error)

function exponentialRetry (opts, task, cb) {
  if (typeof opts === 'function') {
    cb = task
    task = opts
    opts = {}
  }
  opts = opts || {}
  var maxRetries = opts.maxRetries != null ? opts.maxRetries : DEFAULT_MAX_RETRIES
  var maxWait = opts.maxWait != null ? opts.maxWait : DEFAULT_MAX_WAIT
  var expScale = opts.expScale != null ? opts.expScale : DEFAULT_EXP_SCALE
  var linScale = opts.linScale != null ? opts.linScale : DEFAULT_LIN_SCALE
  var trans = opts.trans != null ? opts.trans : DEFAULT_TRANS
  var errScale = opts.errScale != null ? opts.errScale : DEFAULT_ERR_SCALE
  var errTrans = opts.errTrans != null ? opts.errTrans : DEFAULT_ERR_TRANS
  var errorFilter = opts.errorFilter

  return retry({
    times: maxRetries + 1,
    errorFilter: errorFilter,
    interval: function (i) {
      var wait = Math.exp((i - 1) * expScale) * linScale + trans
      if (wait > maxWait) {
        wait = maxWait
      }
      var rnd = 0.5 - Math.random()
      wait = wait + (wait * rnd * errScale) + errTrans
      var res = Math.floor(wait)
      return res
    }
  }, task, cb)
}

module.exports = exponentialRetry
module.exports.MaxRetriesExceededError = MaxRetriesExceededError
