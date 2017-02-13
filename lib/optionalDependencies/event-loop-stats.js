var debug = require('../utils/debug')()
var eventLoopStats

try {
  eventLoopStats = require('event-loop-stats')
} catch (ex) {
  debug.warn("event-loop-stats couldn't be required")
  eventLoopStats = {
    sense: function () {}
  }
}

module.exports = eventLoopStats
