'use strict'

var test = require('tape')
var serviceMocks = require('./utils/serviceMocks')
var pkg = require('../package.json')

var TRACE_MODULE = '..'
var TRACE_COLLECTOR_API_URL = 'https://trace-collector-api.risingstack.com'
var TRACE_API_KEY_TEST = process.env.TRACE_API_KEY || 'dummy-key'
var TRACE_SERVICE_NAME = process.env.TRACE_SERVICE_NAME

test('should get service key', function (t) {
  serviceMocks.mockServiceKeyRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    function (uri, requestBody) {
      t.pass('collector gets service key')
      // some smoke tests
      t.equal(requestBody.name, TRACE_SERVICE_NAME)
      t.equal(requestBody.version, '2')
      t.equal(requestBody.collector.version, pkg.version)
      t.end()
      process.exit()
    })
  require(TRACE_MODULE)
})
