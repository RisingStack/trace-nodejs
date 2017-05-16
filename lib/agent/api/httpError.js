'use strict'

var http = require('http')
var inherits = require('util').inherits

function HttpError (statusCode, response) {
  Error.captureStackTrace && Error.captureStackTrace(this, this.constructor)
  this.message = String(statusCode) + ' - ' + http.STATUS_CODES[statusCode]
  this.statusCode = statusCode
  this.response = response
}
inherits(HttpError, Error)

module.exports = HttpError
