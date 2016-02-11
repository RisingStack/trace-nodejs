var expect = require('chai').expect
var os = require('os')

var ApmMetrics = require('./')

describe('The ApmMetrics module', function () {
  it('exists', function () {
    expect(ApmMetrics).to.be.ok
  })

  it('can be created', function () {
    ApmMetrics.create()
  })

  it('sends metrics', function (done) {
    var activeRequests = 3
    var activeHandlers = 5
    var ISOString = 'date-string'
    var loadAvg = 3.3
    var memoryUsed = 24000000
    var memoryTotal = 12000000
    var memoryRss = 15000000

    var event = {
      emit: function (name, data) {
        expect(name).to.eql('apm')
        expect(data).to.eql({
          memory: {
            used: 22,
            total: 11,
            rss: 14
          },
          eventloop: {
            handlers: activeHandlers,
            requests: activeRequests,
            lag: 30
          },
          cpu: {
            utilization: Math.floor(loadAvg)
          },
          gc: {
            time: 0,
            scavenge: 0,
            marksweep: 0
          },
          timestamp: ISOString
        })

        done()
      },
      APM_METRICS: 'apm'
    }
    var apmMetrics = ApmMetrics.create(event)

    apmMetrics.lagId = 1
    apmMetrics.eventLoopLag[1] = [10, 20]

    this.sandbox.stub(process, '_getActiveRequests', function () {
      return new Array(activeRequests)
    })
    this.sandbox.stub(process, '_getActiveHandles', function () {
      return new Array(activeHandlers)
    })
    this.sandbox.stub(process, 'memoryUsage', function () {
      return {
        rss: memoryRss,
        heapTotal: memoryTotal,
        heapUsed: memoryUsed
      }
    })
    this.sandbox.stub(Date.prototype, 'toISOString', function () {
      return ISOString
    })
    this.sandbox.stub(os, 'loadavg', function () {
      return [loadAvg]
    })

    apmMetrics.collectInterval = 1
    apmMetrics.getMetrics()
  })
})
