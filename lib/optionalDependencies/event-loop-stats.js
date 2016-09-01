var debug = require('debug')('risingstack/trace:optionalDependencies')
var eventLoopStats

try {
  eventLoopStats = require('event-loop-stats')
} catch (ex) {
  debug('[Warning] event-loop-stats couldn\'t be required, possibly a compiler issue - continuing')
  eventLoopStats = {
    sense: function () {}
  }
}

module.exports = eventLoopStats
