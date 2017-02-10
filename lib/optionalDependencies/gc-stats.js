var debug = require('debug')('risingstack/trace')
var dbgFormat = require('../utils/dbgFormat')
var gcStats

try {
  gcStats = require('gc-stats')
} catch (ex) {
  gcStats = function () {
    debug(dbgFormat(dbgFormat.levels.WARN, "gc-stats couldn't be required"))
    return {
      on: function () {}
    }
  }
}

module.exports = gcStats
