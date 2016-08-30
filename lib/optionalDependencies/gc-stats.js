var debug = require('debug')('risingstack/trace')
var gcStats

try {
  gcStats = require('gc-stats')
} catch (ex) {
  gcStats = function () {
    debug('error: [trace]', 'gc-stats couldn\'t be required, possibly a compiler issue - continuing')
    return {
      on: function () {}
    }
  }
}

module.exports = gcStats
