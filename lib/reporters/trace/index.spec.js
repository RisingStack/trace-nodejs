var util = require('util')
var url = require('url')

var TraceReporter = require('./')

var expect = require('chai').expect
var nock = require('nock')
var libPackage = require('../../../package')

var config = require('../../config')

var Events = require('../../events')

var collectorApi = config.collectorApi
var collectorApiServiceEndpoint = config.collectorApiServiceEndpoint
var collectorApiSampleEndpoint = config.collectorApiSampleEndpoint
var collectorApiRpmMetricsEndpoint = config.collectorApiRpmMetricsEndpoint

describe('The Trace reporter module', function () {
  it('exists', function () {
    expect(TraceReporter).to.be.ok
  })

  it('throws an error if apiKey is missing', function () {
    try {
      TraceReporter.create({
        appName: 'test'
      })
    } catch (ex) {
      expect(ex.message).to.eql('Missing apiKey')
      return
    }

    throw new Error('Unhandled error')
  })

  it('throws an error if appName is missing', function () {
    try {
      TraceReporter.create({
        apiKey: 'dsafsd'
      })
    } catch (ex) {
      expect(ex.message).to.eql('Missing appName')
      return
    }

    throw new Error('Unhandled error')
  })

  it('can be instantiated w/ appName and apiKey', function () {
    var traceReporter = TraceReporter.create({
      appName: 'test',
      apiKey: 'test'
    })

    expect(traceReporter).to.be.ok
  })

  it.skip('can send data to the HttpTransaction server synchronously', function () {
    var traceReporter = TraceReporter.create({
      appName: 'test',
      apiKey: 'test'
    })

    var data = {
      trace: 'very data'
    }

    traceReporter.sendSync(data)
  })

  it('can send rpm to HttpTransaction server', function () {
    var options = {
      appName: 'testName',
      apiKey: 'testApiKey'
    }

    var serviceId = 12

    var data = {
      trace: 'very data'
    }

    var path = util.format(collectorApiRpmMetricsEndpoint, serviceId)
    var sendUrl = url.resolve(config.collectorApi, path)

    var traceReporter = TraceReporter.create(options)
    traceReporter.serviceId = serviceId

    var sendStub = this.sandbox.stub(traceReporter, '_send')

    traceReporter.sendRpmMetrics(data)

    expect(sendStub).to.have.been.calledOnce
    expect(sendStub).to.have.been.calledWith(sendUrl, data)
  })

  it('can send data to HttpTransaction server', function () {
    var options = {
      appName: 'testName',
      apiKey: 'testApiKey'
    }

    var data = {
      trace: 'very data'
    }

    var apiMock = nock(collectorApi, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version
      }
    })
      .post(collectorApiSampleEndpoint, function (body) {
        expect(body).to.eql(data)
        return JSON.stringify(data)
      })
      .reply(201)

    var traceReporter = TraceReporter.create(options)

    traceReporter.sendHttpTransactions(data)
    apiMock.done()
  })

  it('can get the service key of appName from HttpTransaction server', function (done) {
    var options = {
      appName: 'testName',
      apiKey: 'testApiKey'
    }

    var data = {
      name: options.appName
    }

    nock(collectorApi, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version
      }
    })
      .post(collectorApiServiceEndpoint, JSON.stringify(data))
      .reply(201, {
        key: 1
      })

    var traceReporter = TraceReporter.create(options)

    var events = Events.create()

    traceReporter.setEventBus(events)

    events.on('trace_service_key', function (data) {
      expect(data).to.eql(1)
      done()
    })
  })

  it('retries on 409 error', function (done) {
    var options = {
      appName: 'testName',
      apiKey: 'testApiKey'
    }
    var data = {
      name: options.appName
    }

    var events = Events.create()

    var traceReporter = TraceReporter.create(options)

    traceReporter.retryLimit = 2
    traceReporter.baseRetryInterval = 0

    nock(collectorApi, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version
      }
    })
      .post(collectorApiServiceEndpoint, JSON.stringify(data))
      .times(traceReporter.retryLimit)
      .reply(409, {})

    traceReporter.setEventBus(events)

    events.on('error', function (data) {
      expect(data).to.eql('The trace collector-api is currently unavailable')
      done()
    })
  })
})
