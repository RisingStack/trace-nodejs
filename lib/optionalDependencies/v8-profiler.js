var debug = require('debug')('risingstack/trace')
var dbgFormat = require('../utils/dbgFormat')
var v8profiler

try {
  v8profiler = require('@risingstack/v8-profiler')
} catch (ex) {
  debug(dbgFormat(dbgFormat.levels.WARN, "v8-profiler couldn't be required"))
  v8profiler = {
    startProfiling: function () {},
    stopProfiling: function () {},
    takeSnapshot: function () {}
  }
}

module.exports = v8profiler
