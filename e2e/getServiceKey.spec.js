'use strict'

var test = require('tape')
var serviceMocks = require('./utils/serviceMocks')

var TRACE_MODULE = '..'
var TRACE_COLLECTOR_API_URL = 'https://trace-collector-api.risingstack.com'
var TRACE_API_KEY_TEST = process.env.TRACE_API_KEY || 'dummy-key'

test('should get service key', function (t) {
  serviceMocks.mockServiceKeyRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    function (uri, requestBody) {
      t.pass('gets service key')
      t.end()
      process.exit()
    })
  require(TRACE_MODULE)
})
