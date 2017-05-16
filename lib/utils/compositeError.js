'use strict'

var inherits = require('util').inherits

function CompositeError (message, cause) {
  if (message instanceof Error) {
    message = ''
    cause = message
  }
  this.message = message ? message.toString() : ''
  this.cause = cause
  Error.captureStackTrace && Error.captureStackTrace(this, this.constructor)
  if (this.stack != null && this.cause instanceof Error && this.cause.stack != null) {
    this.stack += '\nCaused by: ' + this.cause.stack
  }
}
inherits(CompositeError, Error)

module.exports = CompositeError
