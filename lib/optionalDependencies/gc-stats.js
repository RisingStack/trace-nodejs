var debug = require('debug')('risingstack/trace:optionalDependencies')
var gcStats

try {
  gcStats = require('gc-stats')
} catch (ex) {
  gcStats = function () {
    debug('[Warning] gc-stats couldn\'t be required, possibly a compiler issue - continuing')
    return {
      on: function () {}
    }
  }
}

module.exports = gcStats
