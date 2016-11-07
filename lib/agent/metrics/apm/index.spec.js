var expect = require('chai').expect
var os = require('os')
var eventLoopStats = require('event-loop-stats')

var ApmMetrics = require('./')
var Timer = require('../../timer')

describe('The ApmMetrics module', function () {
  it('sends metrics', function () {
    var activeRequests = 3
    var activeHandlers = 5
    var ISOString = 'date-string'
    var loadAvg = 3
    var memoryUsed = 24000000
    var memoryTotal = 12000000
    var memoryRss = 15000000

    var _eventLoopStats = {
      max: 10,
      maxUnit: 'ms',
      min: 0,
      minUnit: 'ms',
      sum: 100,
      sumUnit: 'ms',
      num: 32,
      numUnit: 'pcs'
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

    apmMetrics.gc = {
      time: 6700000,
      scavenge: 3,
      marksweep: 1
    }

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

    this.sandbox.stub(apmMetrics, 'cpuCount', 2)

    apmMetrics.sendMetrics()

    expect(collectorApi.sendApmMetrics).to.be.calledWith({
      memory: {
        used: 22,
        usedUnit: 'MB',
        total: 11,
        totalUnit: 'MB',
        rss: 14,
        rssUnit: 'MB'
      },
      eventloop: {
        handlers: activeHandlers,
        handlersUnit: 'pcs',
        requests: activeRequests,
        requestsUnit: 'pcs',
        stats: _eventLoopStats
      },
      cpu: {
        utilization: 150,
        utilizationUnit: 'pct'
      },
      gc: {
        time: 6,
        timeUnit: 'ms',
        scavenge: 3,
        scavengeUnit: 'pcs',
        marksweep: 1,
        marksweepUnit: 'pcs'
      },
      timestamp: ISOString
    })
  })

  it('does not fail when eventLoopStats is not loaded', function () {
    var activeRequests = 3
    var activeHandlers = 5
    var ISOString = 'date-string'
    var loadAvg = 3
    var memoryUsed = 24000000
    var memoryTotal = 12000000
    var memoryRss = 15000000

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

    apmMetrics.gc = {
      time: 6700000,
      scavenge: 3,
      marksweep: 1
    }

    this.sandbox.stub(eventLoopStats, 'sense')
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

    this.sandbox.stub(apmMetrics, 'cpuCount', 2)

    apmMetrics.sendMetrics()

    expect(collectorApi.sendApmMetrics).to.be.calledWith({
      memory: {
        used: 22,
        usedUnit: 'MB',
        total: 11,
        totalUnit: 'MB',
        rss: 14,
        rssUnit: 'MB'
      },
      cpu: {
        utilization: 150,
        utilizationUnit: 'pct'
      },
      gc: {
        time: 6,
        timeUnit: 'ms',
        scavenge: 3,
        scavengeUnit: 'pcs',
        marksweep: 1,
        marksweepUnit: 'pcs'
      },
      timestamp: ISOString
    })
  })

  it('skips utilization if running in VM', function () {
    var collectorApi = {
      sendApmMetrics: this.sandbox.spy()
    }

    var apmMetrics = ApmMetrics.create({
      collectorApi: collectorApi,
      config: {
        collectInterval: 1,
        isRunningInVm: true
      }
    })

    expect(apmMetrics.getLoad()).to.eql({
      utilization: null
    })
  })

  it('should have a timer', function () {
    var collectorApi = {
      sendApmMetrics: this.sandbox.spy()
    }

    var apmMetrics = ApmMetrics.create({
      collectorApi: collectorApi,
      config: {
        collectInterval: 1,
        isRunningInVm: true
      }
    })

    expect(apmMetrics.timer).to.be.instanceof(Timer)
  })
})
