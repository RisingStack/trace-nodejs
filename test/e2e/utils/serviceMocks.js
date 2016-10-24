'use strict'

var nock = require('nock')

function mockServiceKeyRequest (opts) {
  return nock(opts.url, {
    reqheaders: {
      'Authorization': 'Bearer ' + opts.apiKey
    }
  })
    .post('/v2/service')
    .reply(opts.callback)
}

function mockApmMetricsRequest (opts) {
  return nock(opts.url, {
    reqheaders: {
      'Authorization': 'Bearer ' + opts.apiKey
    }
  })
    .post('/service/' + opts.serviceKey + '/apm-metrics')
    .times(opts.maxTimes || 1)
    .reply(opts.callback || 200)
}

function mockRpmMetricsRequest (opts) {
  return nock(opts.url, {
    reqheaders: {
      'Authorization': 'Bearer ' + opts.apiKey
    }
  })
    .post('/service/' + opts.serviceKey + '/rpm-metrics')
    .times(opts.maxTimes || 1)
    .reply(opts.callback || 200)
}

function mockExternalEdgeMetricsRequest (opts) {
  return nock(opts.url, {
    reqheaders: {
      'Authorization': 'Bearer ' + opts.apiKey
    }
  })
    .post('/service/' + opts.serviceKey + '/edge-external')
    .times(opts.maxTimes || 1)
    .reply(opts.callback || 200)
}

function mockIncomingEdgeMetricsRequest (opts) {
  return nock(opts.url, {
    reqheaders: {
      'Authorization': 'Bearer ' + opts.apiKey
    }
  })
    .post('/service/' + opts.serviceKey + '/edge-incoming')
    .times(opts.maxTimes || 1)
    .reply(opts.callback || 200)
}

function mockControlRequest (opts) {
  return nock(opts.url, {
    reqheaders: {
      'Authorization': 'Bearer ' + opts.apiKey
    }
  })
    .post('/service/' + opts.serviceKey + '/control')
    .times(opts.maxTimes || 1)
    .reply(opts.callback || 200, {
      commands: []
    })
}

function mockTraceRequest (opts) {
  return nock(opts.url, {
    reqheaders: {
      'Authorization': 'Bearer ' + opts.apiKey
    }
  })
    .post('/transaction-events')
    .times(opts.maxTimes || 1)
    .reply(opts.callback || 200)
}

module.exports = {
  mockServiceKeyRequest: mockServiceKeyRequest,
  mockApmMetricsRequest: mockApmMetricsRequest,
  mockRpmMetricsRequest: mockRpmMetricsRequest,
  mockExternalEdgeMetricsRequest: mockExternalEdgeMetricsRequest,
  mockIncomingEdgeMetricsRequest: mockIncomingEdgeMetricsRequest,
  mockTraceRequest: mockTraceRequest,
  mockControlRequest: mockControlRequest
}
