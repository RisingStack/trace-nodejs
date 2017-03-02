'use strict'
var debug = require('../../utils/debug')()
var eventLoopStats

try {
  eventLoopStats = require('@risingstack/event-loop-stats')
} catch (ex) {
  debug.warn("event-loop-stats couldn't be required")
  eventLoopStats = {
    sense: function () {}
  }
}

module.exports = eventLoopStats
