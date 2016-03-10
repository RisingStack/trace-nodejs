var gcStats

try {
  gcStats = require('gc-stats')
} catch (ex) {
  gcStats = function () {
    console.log('gc-stats couldn\'t be required, possibly a compiler issue - continuing')
    return {
      on: function () {}
    }
  }
}

module.exports = gcStats
