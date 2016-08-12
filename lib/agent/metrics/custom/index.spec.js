var expect = require('chai').expect

var CustomMetrics = require('./')

describe('The CustomMetrics module', function () {
  it('sends metrics', function () {
    var ISOString = 'date-string'
    var collectorApi = {
      sendCustomMetrics: this.sandbox.spy()
    }

    this.sandbox.stub(Date.prototype, 'toISOString', function () {
      return ISOString
    })

    var customMetrics = CustomMetrics.create({
      collectorApi: collectorApi,
      config: {
        collectInterval: 1
      }
    })

    customMetrics.increment('/TestCategory/TestName')
    customMetrics.increment('/TestCategory/TestName')
    customMetrics.increment('/TestCategory/TestName', 3)

    customMetrics.record('/TestCategory/TestRecord', 10)
    customMetrics.record('/TestCategory/TestRecord', 2)

    customMetrics.sendMetrics()

    expect(collectorApi.sendCustomMetrics).to.be.calledWith({
      incrementMetrics: {
        '/TestCategory/TestName': 5
      },
      recordMetrics: {
        '/TestCategory/TestRecord': [10, 2]
      }
    })
  })
})
