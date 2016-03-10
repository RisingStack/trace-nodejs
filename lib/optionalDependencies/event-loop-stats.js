var eventLoopStats

try {
  eventLoopStats = require('event-loop-stats')
} catch (ex) {
  console.log('event-loop-stats couldn\'t be required, possibly a compiler issue - continuing')
  eventLoopStats = {
    sense: function () {}
  }
}

module.exports = eventLoopStats
