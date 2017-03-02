'use strict'
var debug = require('debug')
var format = require('util').format

var trace = 'risingstack/trace'

var levels = {
  WARN: 'WARN ',
  INFO: 'INFO ',
  ERROR: 'ERROR'
}

function dbgFormat (logger, lvl, func, message) {
  if (!message) {
    message = func
    return logger(format('[' + lvl + '] ' + message))
  }
  return logger(format('[' + lvl + '] ' + func + ': ' + message))
}

module.exports = function (ns) {
  var suffix = ns ? ':' + ns : ''
  return {
    warn: dbgFormat.bind(this, debug(trace + ':warn' + suffix), levels.WARN),
    info: dbgFormat.bind(this, debug(trace + ':info' + suffix), levels.INFO),
    error: dbgFormat.bind(this, debug(trace + ':error' + suffix), levels.ERROR)
  }
}
