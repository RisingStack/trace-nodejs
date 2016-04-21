'use strict'

var expect = require('chai').expect
var wrap = require('./ioredis')
var Shimmer = require('../utils/shimmer')
var REDIS_URL

function fakeAgent (sandbox) {
  return {
    generateSpanId: function () { return 'fakeSpanId' },
    getMicrotime: function () { return 42 },
    getTransactionId: function () { return 'fakeTransactionId' },
    clientSend: sandbox.spy(),
    clientReceive: sandbox.spy(),
    CLIENT_SEND: 'fakeSend'
  }
}

describe('ioredis module wrapper', function () {
  beforeEach(function () {
    Shimmer.unwrapAll()
  })

  it('should instrument send', function () {
    var agent = fakeAgent(this.sandbox)
    var Redis = wrap(require('ioredis'), agent)
    var client = new Redis(REDIS_URL)

    client.sadd('x', '6')

    expect(agent.clientSend).to.have.callCount(1)

    expect(agent.clientSend).to.have.been.calledWith({
      id: 'fakeTransactionId',
      spanId: 'fakeSpanId',
      host: 'localhost:6379',
      time: 42,
      method: 'sadd',
      type: 'fakeSend',
      url: 'unknown'
    })
  })

  it('should instrument receive callback', function (done) {
    var agent = fakeAgent(this.sandbox)
    var Redis = wrap(require('ioredis'), agent)
    var client = new Redis(REDIS_URL)

    client.sadd('x', '6', function () {
      expect(agent.clientReceive).to.have.callCount(1)
      expect(agent.clientReceive).to.have.been.calledWith({
        host: 'localhost:6379',
        id: 'fakeTransactionId',
        method: 'sadd',
        mustCollect: undefined,
        protocol: 'redis',
        responseTime: 0,
        spanId: 'fakeSpanId',
        status: 0,
        statusCode: 200,
        time: 42,
        url: 'unknown'
      })
      done()
    })
  })

  it('should instrument receive promise', function (done) {
    var agent = fakeAgent(this.sandbox)
    var Redis = wrap(require('ioredis'), agent)
    var client = new Redis(REDIS_URL)

    client.sadd('x', '6').then(function () {
      expect(agent.clientReceive).to.have.callCount(1)
      expect(agent.clientReceive).to.have.been.calledWith({
        host: 'localhost:6379',
        id: 'fakeTransactionId',
        method: 'sadd',
        mustCollect: undefined,
        protocol: 'redis',
        responseTime: 0,
        spanId: 'fakeSpanId',
        status: 0,
        statusCode: 200,
        time: 42,
        url: 'unknown'
      })
      done()
    })
  })
})
