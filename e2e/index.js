'use strict'

var TRACE_API_KEY_TEST = 'api-key'
var TRACE_SERVICE_NAME_TEST = 'service-name'

var childProcessTest = require('./utils/childProcessTest')
var test = require('tape')
var waterfall = require('async').waterfall
var path = require('path')

test('Trace collector', function (t) {
  waterfall([
    childProcessTest.bind(
      null,
      path.resolve(__dirname, 'getServiceKey.spec.js'),
      {
        env: {
          TRACE_API_KEY: TRACE_API_KEY_TEST,
          TRACE_SERVICE_NAME: TRACE_SERVICE_NAME_TEST,
          TRACE_COLLECT_INTERVAL: 100
        }
      }
    ),
    childProcessTest.bind(
      null,
      path.resolve(__dirname, 'reportHttpRequest.spec.js'),
      {
        env: {
          TRACE_API_KEY: TRACE_API_KEY_TEST,
          TRACE_SERVICE_NAME: TRACE_SERVICE_NAME_TEST,
          TRACE_INITIAL_SAMPLE_RATE: 1,
          TRACE_COLLECT_INTERVAL: 100
        }
      }
    ),
    childProcessTest.bind(
      null,
      path.resolve(__dirname, 'reportApmMetrics.spec.js'),
      {
        env: {
          TRACE_API_KEY: TRACE_API_KEY_TEST,
          TRACE_SERVICE_NAME: TRACE_SERVICE_NAME_TEST,
          TRACE_INITIAL_SAMPLE_RATE: 1,
          TRACE_COLLECT_INTERVAL: 100
        }
      }
    )],
    function () {
      t.end()
    }
  )
})
