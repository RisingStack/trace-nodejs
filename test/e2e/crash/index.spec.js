'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var test = require('tape')
var spawnSync = require('spawn-sync')
var defaultsDeep = require('lodash').defaultsDeep
var path = require('path')
var find = require('lodash.find')
// var semver = require('semver')

var TRACE_API_KEY = 'headers.payload.signature'
var TRACE_SERVICE_NAME = 'service-name'
var TEST_WEB_SERVER_PORT = process.env.TEST_WEBSERVER_PORT || 44333 + Math.trunc(Math.random() * 100)
var TEST_TIMEOUT = 10000

var env = {
  TRACE_API_KEY: TRACE_API_KEY,
  TRACE_SERVICE_NAME: TRACE_SERVICE_NAME,
  TRACE_COLLECT_INTERVAL: 100,
  TRACE_UPDATE_INTERVAL: 100000,
  TRACE_COLLECTOR_API_URL: 'http://127.0.0.1:' + TEST_WEB_SERVER_PORT
}

test('should report crash', {
  timeout: TEST_TIMEOUT
}, function (t) {
  var server
  var app = express()
  app.use(bodyParser.json())
  app.post('/transaction-events', function (req, res) {
    try {
      t.ok(req.body.e, 'Events are reported')
      console.log(req.body.e)
      var event = find(req.body.e, function (e) {
        return e.t === 'err' && e.d.t === 'system-error'
      })
      t.ok(event != null, 'Error event exists')
      t.end()
    } finally {
      server.close()
    }
  })
  server = app.listen(TEST_WEB_SERVER_PORT, function (err) {
    t.error(err, 'server starts listening at ' + TEST_WEB_SERVER_PORT)

    spawnSync('node', [path.join(__dirname, 'testee.js')], {
      stdio: [0, 1, 2],
      env: defaultsDeep({}, env, process.env)
    })
  })
})
