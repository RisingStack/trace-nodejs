'use strict'

var test = require('tape')
var serviceMocks = require('./utils/serviceMocks')
var pkg = require('../package.json')

var TRACE_MODULE = '..'
var TRACE_COLLECTOR_API_URL = 'https://trace-collector-api.risingstack.com'
var TRACE_API_KEY_TEST = process.env.TRACE_API_KEY || 'dummy-key'

test('should get service key', function (t) {
  serviceMocks.mockServiceKeyRequest(
    TRACE_COLLECTOR_API_URL,
    TRACE_API_KEY_TEST,
    function (uri, requestBody) {
      t.equal(requestBody.name, process.env.TRACE_SERVICE_NAME, 'service name should be ok')
      t.equal(requestBody.version, '2', 'version should be 2')
      t.equal(requestBody.trace.version, pkg.version, 'package version should be ok')
      t.ok(requestBody.runtime, "property 'runtime' should exist")
      t.ok(requestBody.machine, "property 'machine' should exist")
      t.end()
      process.exit()
    })
  require(TRACE_MODULE)
})
