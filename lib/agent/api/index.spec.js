var util = require('util')
var url = require('url')

var CollectorApi = require('./')

var expect = require('chai').expect
var nock = require('nock')
var libPackage = require('../../../package')
var assign = require('lodash.assign')

describe('The Trace CollectorApi module', function () {
  var defaultConfig = {
    serviceName: 'testName',
    apiKey: 'testApiKey',
    collectorLanguage: 'nodejs',
    collectorApiUrl: 'https://collector.api.mock',
    collectorApiSampleEndpoint: '/service/sample',
    collectorApiServiceEndpoint: '/service',
    collectorApiApmMetricsEndpoint: '/service/%s/apm-metrics',
    collectorApiRpmMetricsEndpoint: '/service/%s/rpm-metrics',
    collectorApiEdgeMetricsEndpoint: '/service/%s/edge-metrics',
    collectorApiIncomingEdgeMetricsEndpoint: '/service/%s/edge-metrics-incoming',
    system: {
      hostname: 'test.org',
      processVersion: '4.3.1',
      processName: 'node',
      processId: 7777,
      osArch: 'x86',
      osPlatform: 'darwin',
      osRelease: '11',
      cpus: [
        {
          model: 'Intel(R) Core(TM) i5-5257U CPU @ 2.70GHz',
          speed: 2700
        },
        {
          model: 'Intel(R) Core(TM) i5-5257U CPU @ 2.70GHz',
          speed: 2700
        },
        {
          model: 'Intel(R) Core(TM) i5-5257U CPU @ 2.70GHz',
          speed: 2700
        },
        { model: 'Intel(R) Core(TM) i5-5257U CPU @ 2.70GHz',
          speed: 2700
        }
      ]
    }
  }

  it('can be instantiated w/ serviceName and apiKey', function () {
    var collectorApi = CollectorApi.create(defaultConfig)
    expect(collectorApi).to.be.ok
  })

  it('sends rpm metrics to the collector server', function () {
    var serviceKey = 12

    var data = {
      trace: 'very data',
      hostname: 'test.org',
      pid: 7777
    }

    var path = util.format(defaultConfig.collectorApiRpmMetricsEndpoint, serviceKey)
    var sendUrl = url.resolve(defaultConfig.collectorApiUrl, path)

    var collectorApi = CollectorApi.create(defaultConfig)
    collectorApi.serviceKey = serviceKey

    var sendStub = this.sandbox.stub(collectorApi, '_send')

    collectorApi.sendRpmMetrics(data)

    expect(sendStub).to.have.been.calledWith(sendUrl, data)
  })

  it('enhances samples with required properties', function (done) {
    var collectorApi = CollectorApi.create(defaultConfig)
    var data = {
      test: 'clearly a mock'
    }

    nock(defaultConfig.collectorApiUrl, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version,
        'X-Reporter-Language': defaultConfig.collectorLanguage
      }
    })
      .post(defaultConfig.collectorApiSampleEndpoint, function (body) {
        expect(body).to.eql(assign({
          version: '2',
          instance: {
            hostname: defaultConfig.system.hostname,
            pid: defaultConfig.system.processId
          },
          service: {
            name: defaultConfig.serviceName,
            key: null
          }
        }, data))
        return JSON.stringify(data)
      })
      .reply(201, function () {
        done()
      })

    collectorApi.sendSamples(data)
  })

  it('sends incomingEdgeMetrics with the required properties', function (done) {
    var serviceKey = 12
    var collectorApi = CollectorApi.create(defaultConfig)
    collectorApi.serviceKey = 12
    var data = {
      test: 'clearly a mock'
    }

    this.sandbox.stub(Date.prototype, 'toISOString', function () {
      return 'time'
    })

    var path = util.format(defaultConfig.collectorApiIncomingEdgeMetricsEndpoint, serviceKey)

    nock(defaultConfig.collectorApiUrl, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version,
        'X-Reporter-Language': defaultConfig.collectorLanguage
      }
    })
      .post(path, function (body) {
        expect(body).to.eql({
          pid: defaultConfig.system.processId,
          hostname: defaultConfig.system.hostname,
          timestamp: 'time',
          data: data
        })
        return true
      })
      .reply(201, function () {
        done()
      })

    collectorApi.sendIncomingEdgeMetrics(data)
  })

  it('can get the service key of serviceName from HttpTransaction server', function (done) {
    var collectorApi = CollectorApi.create(defaultConfig)
    var data = {
      name: 'testName',
      version: '2',
      collector: {
        language: 'nodejs',
        version: libPackage.version
      },
      runtime: {
        name: defaultConfig.system.processName,
        version: defaultConfig.system.processVersion,
        pid: defaultConfig.system.processId
      },
      machine: {
        arch: defaultConfig.system.osArch,
        platform: defaultConfig.system.osPlatform,
        release: defaultConfig.system.osRelease,
        hostname: defaultConfig.system.hostname,
        cpus: defaultConfig.system.cpus
      }
    }

    nock(defaultConfig.collectorApiUrl, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version,
        'X-Reporter-Language': defaultConfig.collectorLanguage
      }
    })
      .post(defaultConfig.collectorApiServiceEndpoint, JSON.stringify(data))
      .reply(201, {
        key: 1
      })

    collectorApi.getService(function (err, key) {
      expect(key).to.eql(1)
      done(err)
    })
  })

  it('retries on 409 error', function (done) {
    var collectorApi = CollectorApi.create(defaultConfig)
    var _getRetryIntervalSpy = this.sandbox.spy(collectorApi, '_getRetryInterval')

    var data = {
      name: 'testName',
      version: '2',
      collector: {
        language: 'nodejs',
        version: libPackage.version
      },
      runtime: {
        name: defaultConfig.system.processName,
        version: defaultConfig.system.processVersion,
        pid: defaultConfig.system.processId
      },
      machine: {
        arch: defaultConfig.system.osArch,
        platform: defaultConfig.system.osPlatform,
        release: defaultConfig.system.osRelease,
        hostname: defaultConfig.system.hostname,
        cpus: defaultConfig.system.cpus
      }
    }

    nock(defaultConfig.collectorApiUrl, {
      reqheaders: {
        'Authorization': 'Bearer testApiKey',
        'Content-Type': 'application/json',
        'X-Reporter-Version': libPackage.version,
        'X-Reporter-Language': defaultConfig.collectorLanguage
      }
    })
      .post(defaultConfig.collectorApiServiceEndpoint, JSON.stringify(data))
      .times(2)
      .reply(409, {})

    collectorApi.getService()

    // FIXME: this is not nice, who can I test it better?
    setTimeout(function () {
      expect(_getRetryIntervalSpy).to.be.called
      done()
    }, 100)
  })
})
