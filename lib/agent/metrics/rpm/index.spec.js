var expect = require('chai').expect

var RpmMetrics = require('./')

describe('The RpmMetrics module', function () {
  it('sends metrics', function () {
    var ISOString = 'date-string'

    var collectorApi = {
      sendRpmMetrics: this.sandbox.spy()
    }

    var rpmMetrics = RpmMetrics.create({
      collectorApi: collectorApi,
      config: {
        collectInterval: 1
      }
    })

    this.sandbox.stub(Date.prototype, 'toISOString', function () {
      return ISOString
    })

    rpmMetrics.addResponseTime(1)
    rpmMetrics.addResponseTime(2)
    rpmMetrics.addResponseTime(7)
    rpmMetrics.addResponseTime(5)
    rpmMetrics.addResponseTime(6)
    rpmMetrics.addResponseTime(11)
    rpmMetrics.addResponseTime(3)

    rpmMetrics.addStatusCode(503)
    rpmMetrics.addStatusCode(200)
    rpmMetrics.addStatusCode(424)
    rpmMetrics.addStatusCode(500)
    rpmMetrics.addStatusCode(201)
    rpmMetrics.addStatusCode(200)
    rpmMetrics.addStatusCode(200)
    rpmMetrics.addStatusCode(424)
    rpmMetrics.addStatusCode(500)

    rpmMetrics.sendMetrics()

    expect(collectorApi.sendRpmMetrics).to.be.calledWith({
      requests: {
        200: 3,
        201: 1,
        424: 2,
        500: 2,
        503: 1
      },
      median: 5,
      ninetyFive: 11,
      timestamp: ISOString
    })
  })
})
