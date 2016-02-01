var util = require('util')
var url = require('url')

var TraceReporter = require('./')

var expect = require('chai').expect
var nock = require('nock')
var _ = require('lodash')

var systemInfo = require('../../utils/systemInfo')
var libPackage = require('../../../package')

var configReader = require('../../utils/configReader')

var Events = require('../../events')

describe('The Trace reporter module', function () {
  it('exists', function () {
    expect(TraceReporter).to.be.ok
  })

  it('throws an error if apiKey is missing', function () {
    var options = configReader.create({serviceName: 'test'}).getConfig()
    try {
      TraceReporter.create(options)
    } catch (ex) {
      console.log(ex)
      expect(ex.message).to.eql('Missing apiKey')
      return
    }

    throw new Error('Expected error to be thrown')
  })

  it('throws an error if serviceName is missing', function () {
    var options = configReader.create({
      apiKey: 'testApiKey'
    }).getConfig()
    try {
      TraceReporter.create(options)
    } catch (ex) {
      expect(ex.message).to.eql('Missing serviceName')
      return
    }

    throw new Error('Expected error to be thrown')
  })

  it('can be instantiated w/ serviceName and apiKey', function () {
    var traceReporter = configReader.create({
      serviceName: 'testName',
      apiKey: 'testApiKey'
    }).getConfig()

    expect(traceReporter).to.be.ok
  })

  it.skip('can send data to the HttpTransaction server synchronously', function () {
    var traceReporter = configReader.create({
      serviceName: 'testName',
      apiKey: 'testApiKey'
    }).getConfig()

    var data = {
      trace: 'very data'
    }

    traceReporter.sendSync(data)
  })

  it('can send rpm to HttpTransaction server', function () {
    var options = configReader.create({
      serviceName: 'testName',
      apiKey: 'testApiKey'
    }).getConfig()

    var serviceId = 12

    var data = {
      trace: 'very data'
    }

    var path = util.format(options.collectorApiRpmMetricsEndpoint, serviceId)
    var sendUrl = url.resolve(options.collectorApiUrl, path)

    var traceReporter = TraceReporter.create(options)
    traceReporter.serviceId = serviceId

    var sendStub = this.sandbox.stub(traceReporter, '_send')

    traceReporter.sendRpmMetrics(data)

    expect(sendStub).to.have.been.calledOnce
    expect(sendStub).to.have.been.calledWith(sendUrl, data)
  })

  it('can send data to HttpTransaction server', function () {
    var options = configReader.create({
      serviceName: 'testName',
      apiKey: 'testApiKey'
    }).getConfig()

    var data = {
      trace: 'very data'
    }

    var apiMock = nock(options.collectorApiUrl, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version
      }
    })
      .post(options.collectorApiSampleEndpoint, function (body) {
        expect(body).to.eql(data)
        return JSON.stringify(data)
      })
      .reply(201)

    var traceReporter = TraceReporter.create(options)

    traceReporter.sendHttpTransactions(data)
    apiMock.done()
  })

  it('can get the service key of serviceName from HttpTransaction server', function (done) {
    var options = configReader.create({
      serviceName: 'testName',
      apiKey: 'testApiKey'
    }).getConfig()

    var data = _.assign({},
      {
        name: options.serviceName,
        version: '2',
        trace: {
          version: libPackage.version
        }
      },
      systemInfo()
    )

    nock(options.collectorApiUrl, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version
      }
    })
      .post(options.collectorApiServiceEndpoint, JSON.stringify(data))
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
    var options = configReader.create({
      serviceName: 'testName',
      apiKey: 'testApiKey'
    }).getConfig()

    var data = _.assign({},
      {
        name: options.serviceName,
        version: '2',
        trace: {
          version: libPackage.version
        }
      },
      systemInfo()
    )

    var events = Events.create()

    var traceReporter = TraceReporter.create(options)

    traceReporter.retryLimit = 2
    traceReporter.baseRetryInterval = 0

    nock(options.collectorApiUrl, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version
      }
    })
      .post(options.collectorApiServiceEndpoint, JSON.stringify(data))
      .times(traceReporter.retryLimit)
      .reply(409, {})

    traceReporter.setEventBus(events)

    events.on('error', function (data) {
      expect(data).to.eql('The trace collector-api is currently unavailable')
      done()
    })
  })
})
