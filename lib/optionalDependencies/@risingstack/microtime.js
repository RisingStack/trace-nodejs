'use strict'
var debug = require('../../utils/debug')()
var microtime

try {
  microtime = require('@risingstack/microtime')
} catch (ex) {
  debug.warn("microtime couldn't be required")
  microtime = {
    now: function () {
      return Date.now() * 1000
    }
  }
}

module.exports = microtime
