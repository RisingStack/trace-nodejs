var debug = require('debug')('risingstack/trace')
var dbgFormat = require('../utils/dbgFormat')
var eventLoopStats

try {
  eventLoopStats = require('event-loop-stats')
} catch (ex) {
  debug(dbgFormat(dbgFormat.levels.WARN, "event-loop-stats couldn't be required"))
  eventLoopStats = {
    sense: function () {}
  }
}

module.exports = eventLoopStats
