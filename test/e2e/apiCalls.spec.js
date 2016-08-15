'use strict'

var express = require('express')
var request = require('superagent')
var test = require('./utils/test')
var serviceMocks = require('./utils/serviceMocks')

var TRACE_COLLECTOR_API_URL = 'https://trace-collector-api.risingstack.com'
var TRACE_API_KEY = 'headers.payload.signature'
var TRACE_SERVICE_NAME = 'service-name'
var TEST_TRACE_SERVICE_KEY = 42
var TEST_TIMEOUT = 1000
var TEST_WEB_SERVER_PORT = process.env.TEST_WEBSERVER_PORT || 44332

var cpOpts = {
  env: {
    TRACE_API_KEY: TRACE_API_KEY,
    TRACE_SERVICE_NAME: TRACE_SERVICE_NAME,
    TRACE_COLLECT_INTERVAL: 100
  }
}

var apiCalls = [
  'RpmMetrics',
  'ApmMetrics',
  'ExternalEdgeMetrics',
  'IncomingEdgeMetrics',
  'Trace'
]

apiCalls.forEach(function (name) {
  test('should report ' + name,
    {
      isolate: 'child-process',
      childProcessOpts: cpOpts
    }, function (t) {
      serviceMocks.mockServiceKeyRequest({
        url: TRACE_COLLECTOR_API_URL,
        apiKey: TRACE_API_KEY,
        callback: function (uri, requestBody) {
          return [200, { key: TEST_TRACE_SERVICE_KEY }]
        }
      })
      serviceMocks['mock' + name + 'Request']({
        url: TRACE_COLLECTOR_API_URL,
        apiKey: TRACE_API_KEY,
        serviceKey: TEST_TRACE_SERVICE_KEY,
        callback: function (uri, requestBody) {
          t.pass('collector sends ' + name)
          t.end()
          process.exit()
        }
      })
      require('@risingstack/trace')
      t.pass('Trace loaded into server')
      // http server
      var app = express()
      app.get('/test', function (req, res) {
        res.send('test')
      })
      app.listen(TEST_WEB_SERVER_PORT, function (err) {
        t.error(err, 'server starts listening at ' + TEST_WEB_SERVER_PORT)
        // http client request
        request
          .get('127.0.0.1:' + TEST_WEB_SERVER_PORT + '/test')
          .set('x-must-collect', '1')
          .end(function (err) {
            t.error(err, 'client sends request to /test')
          })
      })
      setTimeout(function () {
        t.fail('test timed out without completing')
        process.exit(1)
      }, TEST_TIMEOUT)
    })
})
