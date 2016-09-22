'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var test = require('tape')
var spawnSync = require('spawn-sync')
var defaultsDeep = require('lodash.defaultsdeep')
var path = require('path')
var semver = require('semver')

var TRACE_API_KEY = 'headers.payload.signature'
var TRACE_SERVICE_NAME = 'service-name'
var TEST_WEB_SERVER_PORT = process.env.TEST_WEBSERVER_PORT || 44332

var TEST_TIMEOUT = 3000

var env = {
  TRACE_API_KEY: TRACE_API_KEY,
  TRACE_SERVICE_NAME: TRACE_SERVICE_NAME,
  TRACE_COLLECT_INTERVAL: 100,
  TRACE_UPDATE_INTERVAL: 100000,
  TRACE_COLLECTOR_API_URL: 'http://127.0.0.1:' + TEST_WEB_SERVER_PORT
}

test('should report crash', {
  skip: !semver.satisfies(process.version, '>= 6')
}, function (t) {
  t.plan(2)
  var app = express()
  app.use(bodyParser.json())
  app.post('/transaction-events', function (req, res) {
    var event = req.body.e.find(function (e) {
      return e.t === 'err' && e.d.t === 'system-error'
    })
    t.ok(event != null, 'Error event exists')
    t.end()
    process.exit(0)
  })
  app.listen(TEST_WEB_SERVER_PORT, function (err) {
    t.error(err, 'server starts listening at ' + TEST_WEB_SERVER_PORT)

    spawnSync('node', [path.join(__dirname, 'testee.js')], {

      env: defaultsDeep({}, env, process.env)
    })
    setTimeout(function () {
      t.fail('test timed out without completing')
      process.exit(1)
    }, TEST_TIMEOUT)
  })
})
