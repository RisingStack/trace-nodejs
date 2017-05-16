'use strict'

var HttpError = require('./httpError')
var exponentialRetry = require('../../utils/exponentialRetry')

var DEFAULT_MAX_RETRIES = Infinity
var DEFAULT_MAX_WAIT = 10 * 60 * 1000
var DEFAULT_EXP_SCALE = 0.828
var DEFAULT_LIN_SCALE = 150
var DEFAULT_ERR_SCALE = 0.24 // +-12% error

function httpRetry (opts, cb) {
  opts = opts || {}
  var client = opts.client
  var payload = opts.payload
  var reqOpts = opts.reqOpts
  var errorFilter = opts.errorFilter
  var maxRetries = opts.maxRetries != null ? opts.maxRetries : DEFAULT_MAX_RETRIES
  var maxWait = opts.maxWait != null ? opts.maxWait : DEFAULT_MAX_WAIT

  function httpRequest (cb) {
    var completed = false
    var req = client.request(reqOpts, function (response) {
      completed = true
      if (response.statusCode >= 400) {
        return cb(new HttpError(response.statusCode), response)
      }
      return cb(null, response)
    })
    req.on('error', function (err) {
      if (!completed) {
        completed = true
        return cb(err)
      }
    })
    if (payload) {
      req.write(payload)
    }
    req.end()
  }
  return exponentialRetry({
    maxRetries: maxRetries,
    maxWait: maxWait,
    expScale: DEFAULT_EXP_SCALE,
    linScale: DEFAULT_LIN_SCALE,
    errScale: DEFAULT_ERR_SCALE,
    errorFilter: errorFilter
  }, httpRequest, cb)
}

module.exports = httpRetry
