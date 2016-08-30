var debug = require('debug')('risingstack/trace')
var v8profiler

try {
  v8profiler = require('v8-profiler')
} catch (ex) {
  debug('error: [trace]', 'v8-profiler couldn\'t be required, possibly a compiler issue - continuing')
  v8profiler = {
    startProfiling: function () {},
    stopProfiling: function () {},
    takeSnapshot: function () {}
  }
}

module.exports = v8profiler
