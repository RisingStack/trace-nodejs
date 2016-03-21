'use strict'

var test = require('tape')
var serviceMocks = require('./utils/serviceMocks')

var TRACE_MODULE = '..'
var TRACE_COLLECTOR_API_URL = 'https://trace-collector-api.risingstack.com'
var TRACE_API_KEY_TEST = process.env.TRACE_API_KEY || 'dummy-key'
var TRACE_SERVICE_KEY_TEST = 42

test('should report apm metrics', function (t) {
  serviceMocks.mockServiceKeyRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    function (uri, requestBody) {
      return [200, { key: TRACE_SERVICE_KEY_TEST }]
    })
  serviceMocks.mockRpmMetricsRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    TRACE_SERVICE_KEY_TEST,
    1,
    function (uri, requestBody) {
      t.pass('collector sent rpm metrics')
    })
  serviceMocks.mockEdgeMetricsRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    TRACE_SERVICE_KEY_TEST,
    1,
    function (uri, requestBody) {
      t.pass('collector sent edge metrics')
    })
  serviceMocks.mockApmMetricsRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    TRACE_SERVICE_KEY_TEST,
    1,
    function (uri, requestBody) {
      t.pass('collector sent apm metrics')
      t.end()
      process.exit()
    }
  )
  require(TRACE_MODULE)
})
