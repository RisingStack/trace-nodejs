'use strict'

require('string.prototype.startswith')

var sinon = require('sinon')
var test = require('./utils/test')
var serviceMocks = require('./utils/serviceMocks')
var pkg = require('@risingstack/trace/package.json')

var TRACE_COLLECTOR_API_URL = 'https://trace-collector-api.risingstack.com'
var TRACE_API_KEY = 'headers.payload.signature'
var TRACE_SERVICE_NAME = 'service-name'
var TEST_TIMEOUT = 10000

test('should print error on missing service name',
  {
    isolate: 'child-process',
    timeout: TEST_TIMEOUT,
    childProcessOpts: {
      env: {
        TRACE_API_KEY: TRACE_API_KEY,
        TRACE_COLLECT_INTERVAL: 100
      }
    }
  }, function (t) {
    var sandbox = sinon.sandbox.create()
    var consoleErrorStub = sandbox.stub(console, 'error')
    require('@risingstack/trace')
    t.pass('does not crash')
    t.ok(consoleErrorStub.called, 'console.error has been called')
    t.ok(consoleErrorStub.args[0].join(' ').startsWith('error: [trace] Missing service name'), 'message indicates missing service name')
    t.end()
    process.exit(0)
  })
test('should print error on missing API key',
  {
    isolate: 'child-process',
    timeout: TEST_TIMEOUT,
    childProcessOpts: {
      env: {
        TRACE_SERVICE_NAME: TRACE_SERVICE_NAME,
        TRACE_COLLECT_INTERVAL: 100
      }
    }
  }, function (t) {
    var sandbox = sinon.sandbox.create()
    var consoleErrorStub = sandbox.stub(console, 'error')
    require('@risingstack/trace')
    t.pass('does not crash')
    t.ok(consoleErrorStub.called, 'console.error has been called')
    t.ok(consoleErrorStub.args[0].join(' ').startsWith('error: [trace] Missing API key'), 'message indicates missing API key')
    t.end()
    sandbox.restore()
    process.exit(0)
  })

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
    require('@risingstack/trace')
  })

test('should stop', {
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
    }
  })
  var trace = require('@risingstack/trace')
  trace.stop(function (err) {
    t.notOk(err, 'no error')
    t.end()
  })
})
