var expect = require('chai').expect

var EdgeMetrics = require('./')

describe('The EdgeMetrics module', function () {
  it('sends metrics', function () {
    var ISOString = 'date-string'
    var collectorApi = {
      sendEdgeMetrics: this.sandbox.spy()
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
      targetHost: 'rstckapp.com',
      targetServiceKey: 3,
      protocol: 'psql',
      networkDelay: {
        incoming: 30,
        outgoing: 40
      },
      status: 0,
      responseTime: 10
    })

    edgeMetrics.report({
      targetHost: 'rstckapp.com',
      targetServiceKey: 3,
      protocol: 'psql',
      networkDelay: {
        incoming: 20,
        outgoing: 60
      },
      status: 0,
      responseTime: 20
    })

    edgeMetrics.report({
      targetHost: 'rstckapp.com',
      targetServiceKey: 3,
      protocol: 'psql',
      networkDelay: {
        incoming: 1,
        outgoing: 3
      },
      status: 0,
      responseTime: 3
    })

    edgeMetrics.report({
      targetHost: 'herokuapp.com',
      targetServiceKey: 3,
      protocol: 'http',
      networkDelay: {
        incoming: 20,
        outgoing: 40
      },
      status: 1,
      responseTime: 10
    })

    var expectedHostMetrics = [{
      protocol: 'psql',
      targetHosts: [{
        name: 'rstckapp.com',
        metrics: {
          networkDelayIncoming: {
            median: 20,
            ninetyFive: 30
          },
          networkDelayOutgoing: {
            median: 40,
            ninetyFive: 60
          },
          responseTime: {
            median: 10,
            ninetyFive: 20
          },
          status: {
            notOk: 0,
            ok: 3
          },
          targetServiceKey: 3
        }
      }]
    }, {
      protocol: 'http',
      targetHosts: [{
        name: 'herokuapp.com',
        metrics: {
          networkDelayIncoming: {
            median: 20,
            ninetyFive: 20
          },
          networkDelayOutgoing: {
            median: 40,
            ninetyFive: 40
          },
          responseTime: {
            median: 10,
            ninetyFive: 10
          },
          status: {
            notOk: 1,
            ok: 0
          },
          targetServiceKey: 3
        }
      }]
    }]

    edgeMetrics.sendMetrics()
    expect(collectorApi.sendEdgeMetrics).to.be.calledWith({
      timestamp: ISOString,
      hostMetrics: expectedHostMetrics
    })
  })
})
