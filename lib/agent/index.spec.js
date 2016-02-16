var expect = require('chai').expect
var microtime = require('microtime')

var TraceAgent = require('./')

var Metrics = require('./metrics')
var CollectorApi = require('./api')

describe('The Trace agent', function () {
  var agent
  var options
  var collectorApi
  var rpmMetrics
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
    this.sandbox.stub(CollectorApi, 'create').returns(collectorApi)
    this.sandbox.stub(Metrics.apm, 'create')
    this.sandbox.stub(Metrics.rpm, 'create').returns(rpmMetrics)
    this.sandbox.stub(microtime, 'now').returns(time)
    options = {
      config: {

      }
    }
    agent = TraceAgent.create(options)
    agent.serviceKey = serviceKey
  })

  it('does server receive', function () {
    agent.serverReceive({
      id: transactionId,
      spanId: spanId,
      parentId: parentId,
      url: url,
      host: host,
      method: 'GET'
    })

    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.partials[transactionId]).to.eql({
      origin: undefined,
      trace: transactionId,
      span: url,
      host: host,
      service: serviceKey,
      method: 'GET',
      parent: 0,
      events: [{
        type: 'sr',
        id: spanId,
        time: time
      }]
    })
  })

  it('does server send', function () {
    agent.sampleRate = 1
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
      statusCode: 200
    })

    expect(agent.totalRequestCount).to.eql(1)
    expect(agent.partials).to.eql({})
    expect(agent.spans).to.eql([{
      origin: undefined,
      trace: transactionId,
      span: url,
      host: host,
      service: serviceKey,
      method: 'GET',
      parent: 0,
      statusCode: 200,
      isSampled: true,
      isForceSampled: false,
      events: [{
        type: 'sr',
        id: spanId,
        time: time
      }, {
        type: 'ss',
        id: spanId,
        time: time
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
    expect(agent.spans).to.eql([])
    expect(agent.partials[transactionId]).to.eql({
      origin: undefined,
      trace: transactionId,
      span: url,
      host: host,
      service: serviceKey,
      method: 'GET',
      parent: 0,
      events: [{
        type: 'sr',
        id: spanId,
        time: time
      }, {
        type: 'cs',
        id: 'new-span-id',
        time: time,
        method: 'POST',
        host: 'remote-host',
        url: '/products',
        data: undefined
      }]
    })
  })

  it('sends data to the trace servers', function () {
    agent.spans = [
      1,
      2,
      3
    ]
    agent.sampleRate = 2
    agent.totalRequestCount = 6
    agent.sampleSize = 10
    agent._send()

    expect(agent.sampleRate).to.eql(1)
    expect(agent.totalRequestCount).to.eql(0)
    expect(collectorApi.sendSamples).to.be.calledWith({
      sampleRate: 2,
      samples: [1, 2, 3],
      totalRequestCount: 6
    })
  })
})
