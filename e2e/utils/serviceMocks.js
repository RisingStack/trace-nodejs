'use strict'

var nock = require('nock')

/**
 * mockServiceKeyRequest - creates an HTTP mock for the trace api call to the /service endpoint
 *
 * @param  {string} url        the url of the service
 * @param  {string} apiKey     the API key that should be sent along the authorization header.
 * @param  {function} callback a callback to be executed when the request arrived
 * @return {object}            the mock object
 */
function mockServiceKeyRequest (url, apiKey, callback) {
  return nock(url, {
    reqheaders: {
      'Authorization': 'Bearer ' + apiKey
    }
  })
    .post('/service')
    .reply(callback)
}

function mockApmMetricsRequest (url, apiKey, serviceKey, maxTimes, callback) {
  return nock(url, {
    reqheaders: {
      'Authorization': 'Bearer ' + apiKey
    }
  })
    .post('/service/42/apm-metrics')
    .times(maxTimes)
    .reply(callback || 200)
}

function mockRpmMetricsRequest (url, apiKey, serviceKey, maxTimes, callback) {
  return nock(url, {
    reqheaders: {
      'Authorization': 'Bearer ' + apiKey
    }
  })
    .post('/service/42/rpm-metrics')
    .times(maxTimes)
    .reply(callback || 200)
}

function mockEdgeMetricsRequest (url, apiKey, serviceKey, maxTimes, callback) {
  return nock(url, {
    reqheaders: {
      'Authorization': 'Bearer ' + apiKey
    }
  })
    .post('/service/42/edge-metrics')
    .times(maxTimes)
    .reply(callback || 200)
}

function mockHttpTransactionRequest (url, apiKey, callback) {
  return nock(url, {
    reqheaders: {
      'Authorization': 'Bearer ' + apiKey
    }
  })
    .post('/service/sample')
    .reply(callback || 200)
}

module.exports = {
  mockServiceKeyRequest: mockServiceKeyRequest,
  mockApmMetricsRequest: mockApmMetricsRequest,
  mockRpmMetricsRequest: mockRpmMetricsRequest,
  mockEdgeMetricsRequest: mockEdgeMetricsRequest,
  mockHttpTransactionRequest: mockHttpTransactionRequest
}
