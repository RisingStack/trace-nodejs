var expect = require('chai').expect
var microtime = require('microtime')

var Agent = require('./')

var Metrics = require('./metrics')
var CollectorApi = require('./api')

describe('The Trace agent', function () {
  var agent
  var options
  var collectorApi
  var rpmMetrics
  var incomingEdgeMetrics
  var requestId
  var parentCommId
  var childCommId
  var parentServiceId
  var url
  var host
  var serviceKey
  var time
  var responseTime

  beforeEach(function () {
    requestId = 42
    parentCommId = '22'
    childCommId = '23'
    parentServiceId = 0
    serviceKey = 2
    url = '/?id=1'
    host = 'localhost'
    time = 12345678
    responseTime = 100
    collectorApi = {
      sendSamples: this.sandbox.spy(),
      getService: this.sandbox.spy(),
      getUpdates: this.sandbox.spy()
    }
    rpmMetrics = {
      addResponseTime: this.sandbox.spy(),
      addStatusCode: this.sandbox.spy()
    }
    incomingEdgeMetrics = {
      report: this.sandbox.spy()
    }
    this.sandbox.stub(CollectorApi, 'create').returns(collectorApi)
    this.sandbox.stub(Metrics.apm, 'create')
    this.sandbox.stub(Metrics.rpm, 'create').returns(rpmMetrics)
    this.sandbox.stub(Metrics.incomingEdge, 'create').returns(incomingEdgeMetrics)
    this.sandbox.stub(microtime, 'now').returns(time)
    options = {
      config: {

      }
    }
    agent = Agent.create(options)
    agent.serviceKey = serviceKey
  })

  it('does server receive', function () {
    var originTime = String(time - 1000)

    agent.serverReceive({
      requestId: requestId,
      parentCommId: parentCommId,
      parentServiceId: parentServiceId,
      url: url,
      host: host,
      method: 'GET',
      originTime: originTime,
      protocol: 'http',
      time: time
    })

    expect(incomingEdgeMetrics.report).to.have.been.calledWith({
      transportDelay: 1000,
      serviceKey: parentServiceId,
      protocol: 'http'
    })
    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.partials[requestId]).to.eql({
      requestId: requestId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: parentCommId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: originTime
        }
      }]
    })
  })

  it('reports crashes', function () {
    var sendStub = this.sandbox.stub(agent, '_send', function () {})
    var error = new Error('error')
    error.stack = 'stacktrace'
    this.sandbox.stub(agent, 'getMicrotime', function () {
      return time
    })
    this.sandbox.stub(agent, 'generateRequestId', function () {
      return requestId
    })
    this.sandbox.stub(agent, 'generateCommId', function () {
      return parentCommId
    })

    agent.onCrash({
      stackTrace: error
    })

    expect(agent.reservoirSampler.getItems()).to.eql([
      {
        requestId: requestId,
        isSampled: false,
        isForceSampled: true,
        events: [
          {
            type: 'sr',
            time: time,
            data: {
              endpoint: 'stacktrace',
              method: 'ERROR',
              rpcId: parentCommId
            }
          },
          {
            type: 'err',
            time: time,
            data: {
              rpcId: parentCommId,
              type: 'system-error',
              message: error.message,
              raw: {
                stack: error.stack
              }
            }
          },
          {
            type: 'ss',
            time: time,
            data: {
              rpcId: parentCommId,
              statusCode: 500
            }
          }
        ]
      }
    ])
    expect(sendStub).to.be.calledWith({
      isSync: true
    })
  })

  it('does server receive when there is no parentId', function () {
    agent.serverReceive({
      requestId: requestId,
      parentCommId: parentCommId,
      url: url,
      host: host,
      method: 'GET',
      protocol: 'http'
    })

    expect(incomingEdgeMetrics.report).to.have.been.calledWith({
      protocol: 'http',
      serviceKey: undefined,
      transportDelay: NaN
    })
    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.partials[requestId]).to.eql({
      requestId: requestId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: parentCommId,
          endpoint: url,
          method: 'GET',
          parent: undefined,
          originTime: undefined
        }
      }]
    })
  })

  it('does server send', function () {
    var statusCode = 200
    agent.serverReceive({
      requestId: requestId,
      parentCommId: parentCommId,
      parentServiceId: parentServiceId,
      url: url,
      host: host,
      method: 'GET'
    })

    agent.serverSend({
      requestId: requestId,
      parentCommId: parentCommId,
      responseTime: responseTime,
      statusCode: statusCode,
      mustCollect: '1'
    })

    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.partials).to.eql({})
    expect(agent.reservoirSampler.getItems()).to.eql([{
      requestId: requestId,
      isForceSampled: true,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: parentCommId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: undefined
        }
      }, {
        type: 'ss',
        time: time,
        data: {
          rpcId: parentCommId,
          statusCode: statusCode
        }
      }]
    }])
  })

  it('does client send', function () {
    agent.sampleRate = 1
    agent.serverReceive({
      requestId: requestId,
      parentCommId: parentCommId,
      parentServiceId: parentServiceId,
      url: url,
      host: host,
      method: 'GET'
    })
    agent.clientSend({
      requestId: requestId,
      childCommId: childCommId,
      method: 'POST',
      host: 'remote-host',
      url: '/products'
    })

    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.reservoirSampler.getItems()).to.eql([])
    expect(agent.partials[requestId]).to.eql({
      requestId: requestId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: parentCommId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: undefined
        }
      }, {
        type: 'cs',
        time: time,
        data: {
          rpcId: childCommId,
          method: 'POST',
          host: 'remote-host',
          endpoint: '/products'
        }
      }]
    })
  })

  it('does report', function () {
    agent.sampleRate = 1
    agent.serverReceive({
      requestId: requestId,
      parentCommId: parentCommId,
      parentServiceId: parentServiceId,
      url: url,
      host: host,
      method: 'GET'
    })
    this.sandbox.stub(agent, 'getRequestId').returns(requestId)
    this.sandbox.stub(agent, 'getParentCommId').returns(parentCommId)
    agent.report('obviously', { a: 'mock' })
    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.reservoirSampler.getItems()).to.eql([])
    expect(agent.partials[requestId]).to.eql({
      requestId: requestId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: parentCommId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: undefined
        }
      }, {
        type: 'us',
        time: time,
        data: {
          rpcId: parentCommId,
          name: 'obviously',
          raw: {
            a: 'mock'
          }
        }
      }]
    })
  })

  it('does report error', function () {
    agent.sampleRate = 1
    agent.serverReceive({
      requestId: requestId,
      parentCommId: parentCommId,
      parentServiceId: parentServiceId,
      url: url,
      host: host,
      method: 'GET'
    })
    this.sandbox.stub(agent, 'getRequestId').returns(requestId)
    this.sandbox.stub(agent, 'getParentCommId').returns(parentCommId)

    agent.reportError('mocking a', new Error('with style'))
    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.reservoirSampler.getItems()).to.eql([])
    expect(agent.partials[requestId]).to.eql({
      requestId: requestId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: parentCommId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: undefined
        }
      }, {
        type: 'err',
        time: time,
        data: {
          rpcId: parentCommId,
          name: 'mocking a',
          type: 'user-sent-error',
          message: 'with style',
          raw: new Error('with style')
        }
      }]
    })
  })

  it('clears a transaction', function () {
    agent.partials[requestId] = {
      data: 'something'
    }

    agent.clearRequest(requestId)
    expect(agent.partials).to.eql({})
  })

  it('passes sample and span data to the API client', function () {
    agent.reservoirSampler.addReturnsSuccess(1)
    agent.totalRequestCount = 6
    agent._send()

    expect(agent.totalRequestCount).to.eql(0)
    expect(collectorApi.sendSamples).to.be.calledWith({
      spans: [1],
      sample: {
        rate: 1,
        totalRequestCount: 1
      }
    })
  })

  it('limits must-collect count to 20', function () {
    var statusCode = 200
    for (var i = 0; i < 100; i += 1) {
      agent.reservoirSampler.addReturnsSuccess(1)
    }
    agent.serverReceive({
      requestId: requestId,
      parentCommId: parentCommId,
      parentServiceId: parentServiceId,
      url: url,
      host: host,
      method: 'GET'
    })

    agent.serverSend({
      requestId: requestId,
      parentCommId: parentCommId,
      responseTime: responseTime,
      statusCode: statusCode,
      mustCollect: '1'
    })

    expect(agent.reservoirSampler.getItems().length).to.eql(100)
    expect(agent.reservoirSampler.itemsSeen).to.eql(101)
  })
})
