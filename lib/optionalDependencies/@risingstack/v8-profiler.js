'use strict'
var debug = require('../../utils/debug')()
var v8profiler

try {
  v8profiler = require('@risingstack/v8-profiler')
} catch (ex) {
  debug.warn("v8-profiler couldn't be required")
  v8profiler = {
    startProfiling: function () {},
    stopProfiling: function () {},
    takeSnapshot: function () {}
  }
}

module.exports = v8profiler
