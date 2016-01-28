'use strict'

var _ = require('lodash')
var spawn = require('child_process').spawn

function childProcessTest (testModule, options, callback) {
  var env = process.env
  if (options && options.env) {
    _.extend(env, options.env)
  }
  var testProcess = spawn('node', [testModule], { env: env })
  testProcess.stdout.pipe(process.stdout)
  testProcess.stderr.pipe(process.stderr)

  testProcess.on('exit', function (code) {
    var err = code ? new Error(code) : null
    callback(err)
  })
}

module.exports = childProcessTest
