'use strict'
var expect = require('chai').expect

var ExternalEdgeMetrics = require('./')
var Timer = require('../../timer')

describe('The ExternalEdgeMetrics module', function () {
  it('discards undefined responseTime values', function () {
    var ISOString = 'date-string'
    var collectorApi = {
      sendExternalEdgeMetrics: this.sandbox.spy()
    }

    var edgeMetrics = ExternalEdgeMetrics.create({
      collectorApi: collectorApi,
      config: {
        collectInterval: 1
      }
    })

    this.sandbox.stub(Date.prototype, 'toISOString').callsFake(function () {
      return ISOString
    })

    edgeMetrics.report({
      targetHost: 'rstckapp.com',
      protocol: 'psql',
      status: 0
    })

    expect(edgeMetrics.metrics).to.eql({})
  })

  it('sends metrics', function () {
    var ISOString = 'date-string'
    var collectorApi = {
      sendExternalEdgeMetrics: this.sandbox.spy()
    }

    var edgeMetrics = ExternalEdgeMetrics.create({
      collectorApi: collectorApi,
      config: {
        collectInterval: 1
      }
    })

    this.sandbox.stub(Date.prototype, 'toISOString').callsFake(function () {
      return ISOString
    })

    edgeMetrics.report({
      targetHost: 'rstckapp.com',
      protocol: 'psql',
      status: 0,
      responseTime: 10
    })

    edgeMetrics.report({
      targetHost: 'rstckapp.com',
      protocol: 'psql',
      status: 0,
      responseTime: 20
    })

    edgeMetrics.report({
      targetHost: 'rstckapp.com',
      protocol: 'psql',
      status: 0,
      responseTime: 3
    })

    edgeMetrics.report({
      targetHost: 'herokuapp.com',
      protocol: 'http',
      status: 1,
      responseTime: 10
    })

    var expectedHostMetrics = [{
      protocol: 'psql',
      target: {
        id: 'rstckapp.com'
      },
      metrics: {
        responseTime: {
          median: 10,
          ninetyFive: 20
        },
        status: {
          notOk: 0,
          ok: 3
        }
      }
    }, {
      protocol: 'http',
      target: {
        id: 'herokuapp.com'
      },
      metrics: {
        responseTime: {
          median: 10,
          ninetyFive: 10
        },
        status: {
          notOk: 1,
          ok: 0
        }
      }
    }]

    edgeMetrics.sendMetrics()
    expect(collectorApi.sendExternalEdgeMetrics).to.be.calledWith({
      timestamp: ISOString,
      data: expectedHostMetrics
    })
  })

  it('should have a timer', function () {
    var collectorApi = {
      sendExternalEdgeMetrics: this.sandbox.spy()
    }
    var edgeMetrics = ExternalEdgeMetrics.create({
      collectorApi: collectorApi,
      config: {
        collectInterval: 1
      }
    })

    expect(edgeMetrics.timer).to.be.instanceof(Timer)
  })
})
