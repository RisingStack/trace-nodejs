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
  var transactionId
  var spanId
  var parentId
  var url
  var host
  var serviceKey
  var time
  var responseTime

  beforeEach(function () {
    transactionId = 42
    spanId = '22'
    parentId = 0
    serviceKey = 2
    url = '/?id=1'
    host = 'localhost'
    time = 12345678
    responseTime = 100
    collectorApi = {
      sendSamples: this.sandbox.spy(),
      getService: this.sandbox.spy()
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
      id: transactionId,
      spanId: spanId,
      parentId: parentId,
      url: url,
      host: host,
      method: 'GET',
      originTime: originTime,
      protocol: 'http',
      time: time
    })

    expect(incomingEdgeMetrics.report).to.have.been.calledWith({
      transportDelay: 1000,
      serviceKey: parentId,
      protocol: 'http'
    })
    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.partials[transactionId]).to.eql({
      requestId: transactionId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: spanId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: originTime
        }
      }]
    })
  })

  it('does server receive when there is no parentId', function () {
    agent.serverReceive({
      id: transactionId,
      spanId: spanId,
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
    expect(agent.partials[transactionId]).to.eql({
      requestId: transactionId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: spanId,
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
      id: transactionId,
      spanId: spanId,
      parentId: parentId,
      url: url,
      host: host,
      method: 'GET'
    })

    agent.serverSend({
      id: transactionId,
      spanId: spanId,
      responseTime: responseTime,
      statusCode: statusCode,
      mustCollect: '1'
    })

    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.partials).to.eql({})
    expect(agent.reservoirSampler.getItems()).to.eql([{
      requestId: transactionId,
      isForceSampled: true,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: spanId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: undefined
        }
      }, {
        type: 'ss',
        time: time,
        data: {
          rpcId: spanId,
          statusCode: statusCode
        }
      }]
    }])
  })

  it('does client send', function () {
    agent.sampleRate = 1
    agent.serverReceive({
      id: transactionId,
      spanId: spanId,
      parentId: parentId,
      url: url,
      host: host,
      method: 'GET'
    })
    agent.clientSend({
      id: transactionId,
      spanId: 'new-span-id',
      method: 'POST',
      host: 'remote-host',
      url: '/products'
    })

    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.reservoirSampler.getItems()).to.eql([])
    expect(agent.partials[transactionId]).to.eql({
      requestId: transactionId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: spanId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: undefined
        }
      }, {
        type: 'cs',
        time: time,
        data: {
          rpcId: 'new-span-id',
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
      id: transactionId,
      spanId: spanId,
      parentId: parentId,
      url: url,
      host: host,
      method: 'GET'
    })
    this.sandbox.stub(agent, 'getTransactionId').returns(transactionId)
    this.sandbox.stub(agent, 'getSpanId').returns(spanId)
    agent.report('obviously', { a: 'mock' })
    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.reservoirSampler.getItems()).to.eql([])
    expect(agent.partials[transactionId]).to.eql({
      requestId: transactionId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: spanId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: undefined
        }
      }, {
        type: 'us',
        time: time,
        data: {
          rpcId: spanId,
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
      id: transactionId,
      spanId: spanId,
      parentId: parentId,
      url: url,
      host: host,
      method: 'GET'
    })
    this.sandbox.stub(agent, 'getTransactionId').returns(transactionId)
    this.sandbox.stub(agent, 'getSpanId').returns(spanId)

    agent.reportError('mocking a', new Error('with style'))
    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.reservoirSampler.getItems()).to.eql([])
    expect(agent.partials[transactionId]).to.eql({
      requestId: transactionId,
      isForceSampled: false,
      isSampled: false,
      events: [{
        type: 'sr',
        time: time,
        data: {
          rpcId: spanId,
          endpoint: url,
          method: 'GET',
          parent: 0,
          originTime: undefined
        }
      }, {
        type: 'err',
        time: time,
        data: {
          rpcId: spanId,
          name: 'mocking a',
          type: 'user-sent-error',
          message: 'with style',
          raw: new Error('with style')
        }
      }]
    })
  })

  it('clears a transaction', function () {
    agent.partials[transactionId] = {
      data: 'something'
    }

    agent.clearTransaction(transactionId)
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
      id: transactionId,
      spanId: spanId,
      parentId: parentId,
      url: url,
      host: host,
      method: 'GET'
    })

    agent.serverSend({
      id: transactionId,
      spanId: spanId,
      responseTime: responseTime,
      statusCode: statusCode,
      mustCollect: '1'
    })

    expect(agent.reservoirSampler.getItems().length).to.eql(100)
    expect(agent.reservoirSampler.itemsSeen).to.eql(101)
  })
})
