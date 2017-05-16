'use strict'
require('string.prototype.startswith')

var test = require('./utils/test')
var serviceMocks = require('./utils/serviceMocks')
var pkg = require('../../package.json')

var TRACE_COLLECTOR_API_URL = 'https://trace-collector-api.risingstack.com'
var TRACE_API_KEY = 'headers.payload.signature'
var TRACE_SERVICE_NAME = 'service-name'
var TEST_TIMEOUT = 10000
var TEST_TRACE_SERVICE_KEY = 42

var testSetup = {
  isolate: 'child-process',
  timeout: TEST_TIMEOUT,
  childProcessOpts: {
    env: {
      TRACE_API_KEY: TRACE_API_KEY,
      TRACE_SERVICE_NAME: TRACE_SERVICE_NAME,
      TRACE_COLLECT_INTERVAL: 100
    }
  }
}

test('should get service key',
  {
    isolate: 'child-process',
    timeout: TEST_TIMEOUT,
    childProcessOpts: {
      env: {
        TRACE_API_KEY: TRACE_API_KEY,
        TRACE_SERVICE_NAME: TRACE_SERVICE_NAME,
        TRACE_COLLECT_INTERVAL: 100
      }
    }
  }, function (t) {
    serviceMocks.mockServiceKeyRequest({
      url: TRACE_COLLECTOR_API_URL,
      apiKey: TRACE_API_KEY,
      callback: function (uri, requestBody) {
        // some smoke tests
        t.equal(requestBody.name, TRACE_SERVICE_NAME, 'service name ok')
        t.equal(requestBody.version, '2', 'schema version ok')
        t.equal(requestBody.collector.version, pkg.version, 'collector version ok')
        t.end()
        process.exit(0)
      }
    })
    require('../..')
  })

test('should retry',
  {
    isolate: 'child-process',
    timeout: TEST_TIMEOUT * 2,

    childProcessOpts: {
      env: {
        TRACE_API_KEY: TRACE_API_KEY,
        TRACE_SERVICE_NAME: TRACE_SERVICE_NAME,
        TRACE_COLLECT_INTERVAL: 100
      }
    }
  }, function (t) {
    var requests = 0
    var time
    serviceMocks.mockServiceKeyRequest({
      url: TRACE_COLLECTOR_API_URL,
      apiKey: TRACE_API_KEY,
      maxTimes: 5,
      callback: function (uri, requestBody) {
        var old = time
        time = Date.now()
        t.equal(requestBody.name, TRACE_SERVICE_NAME, 'request ' + requests + ': +' + String(time - old) + ' ms')
        if (requests >= 4) {
          t.end()
        } else {
          ++requests
          return [500, {}]
        }
      }
    })
    t.plan(5)
    time = Date.now()
    require('../..')
  })

test('should stop', testSetup, function (t) {
  serviceMocks.mockServiceKeyRequest({
    url: TRACE_COLLECTOR_API_URL,
    apiKey: TRACE_API_KEY,
    callback: function (uri, requestBody) {
      return [200, { key: TEST_TRACE_SERVICE_KEY }]
    }
  })

  serviceMocks.mockApmMetricsRequest({
    url: TRACE_COLLECTOR_API_URL,
    apiKey: TRACE_API_KEY,
    serviceKey: 42,
    callback: function () {
      return [200]
    }
  })

  serviceMocks.mockCustomMetricsRequest({
    url: TRACE_COLLECTOR_API_URL,
    apiKey: TRACE_API_KEY,
    serviceKey: 42,
    callback: function () {
      return [200]
    }
  })

  var trace = require('../..')

  setTimeout(function () {
    trace.stop(function (err) {
      t.notOk(err, 'the callback should not be called with an error')
      t.end()
    })
  }, 100)
})
