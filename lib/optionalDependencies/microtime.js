var debug = require('debug')('risingstack/trace')
var dbgFormat = require('../utils/dbgFormat')
var microtime

try {
  microtime = require('microtime')
} catch (ex) {
  debug(dbgFormat(dbgFormat.levels.WARN, "microtime couldn't be required"))
  microtime = {
    now: function () {
      return Date.now() * 1000
    }
  }
}

module.exports = microtime
