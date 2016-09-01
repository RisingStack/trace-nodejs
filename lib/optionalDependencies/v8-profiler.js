var debug = require('debug')('risingstack/trace:optionalDependencies')
var v8profiler

try {
  v8profiler = require('@risingstack/v8-profiler')
} catch (ex) {
  debug('[Warning] v8-profiler couldn\'t be required, possibly a compiler issue - continuing')
  v8profiler = {
    startProfiling: function () {},
    stopProfiling: function () {},
    takeSnapshot: function () {}
  }
}

module.exports = v8profiler
