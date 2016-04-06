var expect = require('chai').expect

var EdgeMetrics = require('./')

describe('The IncomingEdgeMetrics module', function () {
  it('sends metrics', function () {
    var ISOString = 'date-string'
    var collectorApi = {
      sendIncomingEdgeMetrics: this.sandbox.spy()
    }

    var edgeMetrics = EdgeMetrics.create({
      collectorApi: collectorApi,
      config: {
        collectInterval: 1
      }
    })

    this.sandbox.stub(Date.prototype, 'toISOString', function () {
      return ISOString
    })

    edgeMetrics.report({
      serviceKey: 3,
      protocol: 'http',
      transportDelay: 5
    })

    edgeMetrics.report({
      serviceKey: 3,
      protocol: 'http',
      transportDelay: 10
    })

    edgeMetrics.report({
      serviceKey: 5,
      protocol: 'http',
      transportDelay: 10
    })

    edgeMetrics.report({
      serviceKey: 5,
      protocol: 'http',
      transportDelay: 20
    })

    edgeMetrics.sendMetrics()

    expect(collectorApi.sendIncomingEdgeMetrics).to.be.calledWith([{
      count: 2,
      metrics: { transportDelay: { median: 5, ninetyFive: 10 } },
      protocol: 'http',
      serviceKey: '3'
    }, {
      count: 2,
      metrics: { transportDelay: { median: 10, ninetyFive: 20 } },
      protocol: 'http',
      serviceKey: '5'
    }])
  })
})
