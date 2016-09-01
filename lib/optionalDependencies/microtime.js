var debug = require('debug')('risingstack/trace:optionalDependencies')
var microtime

try {
  microtime = require('microtime')
} catch (ex) {
  debug('[Warning] microtime couldn\'t be required, possibly a compiler issue - continuing')
  microtime = {
    now: function () {
      return Date.now() * 1000
    }
  }
}

module.exports = microtime
