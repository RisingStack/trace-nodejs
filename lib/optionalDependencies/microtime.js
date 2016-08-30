var debug = require('debug')('risingstack/trace')
var microtime

try {
  microtime = require('microtime')
} catch (ex) {
  debug('error: [trace]', 'microtime couldn\'t be required, possibly a compiler issue - continuing')
  microtime = {
    now: function () {
      return Date.now() * 1000
    }
  }
}

module.exports = microtime
