'use strict'
var debug = require('../../utils/debug')()
var gcStats

try {
  gcStats = require('@risingstack/gc-stats')
} catch (ex) {
  gcStats = function () {
    debug.warn("gc-stats couldn't be required")
    return {
      on: function () {}
    }
  }
}

module.exports = gcStats
