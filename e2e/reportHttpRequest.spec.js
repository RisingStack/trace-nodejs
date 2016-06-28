'use strict'

var express = require('express')
var request = require('superagent')
var test = require('tape')
var serviceMocks = require('./utils/serviceMocks')

var TRACE_MODULE = '..'
var TRACE_COLLECTOR_API_URL = 'https://trace-collector-api.risingstack.com'
var TRACE_API_KEY_TEST = process.env.TRACE_API_KEY || 'dummy-key'
var WEB_SERVER_PORT = process.env.WEBSERVER_PORT || 44332
var DUMMY_SERVICE_KEY = 42

test('should report http requests', function (t) {
  serviceMocks.mockServiceKeyRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    function (uri, requestBody) {
      return [200, { key: DUMMY_SERVICE_KEY }]
    })
  serviceMocks.mockApmMetricsRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    DUMMY_SERVICE_KEY,
    Number.MAX_SAFE_INTEGER) // set the times parameter high so the http mock catches all
  serviceMocks.mockRpmMetricsRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    DUMMY_SERVICE_KEY,
    Number.MAX_SAFE_INTEGER) // set the times parameter high so the http mock catches all
  serviceMocks.mockExternalEdgeMetricsRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    42,
    Number.MAX_SAFE_INTEGER)
  serviceMocks.mockIncomingEdgeMetricsRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    42,
    Number.MAX_SAFE_INTEGER)
  serviceMocks.mockControlRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    42,
    Number.MAX_SAFE_INTEGER)
  serviceMocks.mockHttpTransactionRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    function (uri, requestBody) {
      t.pass('collector sends trace')
      // some smoke tests
      t.equal(requestBody.version, '2')
      t.equal(requestBody.service.key, DUMMY_SERVICE_KEY)
      t.equal(requestBody.spans.length, 1)
      t.end()
      process.exit()
    })

  require(TRACE_MODULE)

  // http server
  var app = express()
  app.get('/test', function (req, res) {
    res.send('test')
  })
  app.listen(WEB_SERVER_PORT, function (err) {
    t.error(err, 'server startsat ' + WEB_SERVER_PORT)
    // http client request
    request
      .get('127.0.0.1:' + WEB_SERVER_PORT + '/test')
      .set('x-must-collect', '1')
      .end(function (err) {
        t.error(err, 'client sends request')
      })
  })
})
