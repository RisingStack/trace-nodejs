var expect = require('chai').expect
var os = require('os')
var eventLoopStats = require('event-loop-stats')

var ApmMetrics = require('./')

describe('The ApmMetrics module', function () {
  it('sends metrics', function () {
    var activeRequests = 3
    var activeHandlers = 5
    var ISOString = 'date-string'
    var loadAvg = 3.3
    var memoryUsed = 24000000
    var memoryTotal = 12000000
    var memoryRss = 15000000

    var _eventLoopStats = {
      max: 10,
      min: 0,
      sum: 100,
      num: 32
    }

    var collectorApi = {
      sendApmMetrics: this.sandbox.spy()
    }

    var apmMetrics = ApmMetrics.create({
      collectorApi: collectorApi,
      config: {
        collectInterval: 1
      }
    })
    apmMetrics.lagId = 1

    this.sandbox.stub(eventLoopStats, 'sense', function () {
      return _eventLoopStats
    })
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

    apmMetrics.sendMetrics()

    expect(collectorApi.sendApmMetrics).to.be.calledWith({
      memory: {
        used: 22,
        total: 11,
        rss: 14
      },
      eventloop: {
        handlers: activeHandlers,
        requests: activeRequests,
        stats: _eventLoopStats
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
  })
})
