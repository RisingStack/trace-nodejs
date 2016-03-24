'use strict'

var expect = require('chai').expect
var wrapper = require('./ioredis')
var Shimmer = require('../utils/shimmer')
var consts = require('../consts')

describe('The ioredis wrapper module', function () {
  it('should wrap redis.prototype.sendCommand', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var fakeRedis = { }

    // wrapped as a side effect
    wrapper(fakeRedis, null)

    expect(shimmerWrapStub).to.have.been.calledWith(
      fakeRedis.prototype,
      'redis.prototype',
      'sendCommand'
    )
  })

  it('should call clientSend on the Agent when command is sent', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var FakeRedis = function () {
      this.options = {
        host: 'fakeRedisAddress'
      }
    }

    var fakeAgent = {
      generateSpanId: function () { return 'fakeSpanId' },
      getMicrotime: function () { return 42 },
      getTransactionId: function () { return 'fakeTransactionId' },
      clientSend: this.sandbox.spy(),
      clientReceive: this.sandbox.spy(),
      CLIENT_SEND: 'fakeSend'
    }

    // wrapped as a side effect
    wrapper(FakeRedis, fakeAgent)
    var wrapOp = shimmerWrapStub.args[0][3]

    var resolvingPromise = {
      then: function (s, j) {
        s()
      }
    }

    var fakeRedisClientSend = this.sandbox.spy(function (command) {
      return resolvingPromise
    })

    var fakeRedisCommand = { name: 'hset' }

    wrapOp(fakeRedisClientSend).call(new FakeRedis(), fakeRedisCommand)

    expect(fakeAgent.clientSend).to.have.been.calledOnce
    expect(fakeAgent.clientSend).to.have.been.calledWith({
      id: 'fakeTransactionId',
      spanId: 'fakeSpanId',
      host: 'fakeRedisAddress',
      time: 42,
      type: fakeAgent.CLIENT_SEND,
      url: 'unknown',
      method: 'hset'
    })

    expect(fakeAgent.clientReceive).to.have.been.calledOnce
    expect(fakeAgent.clientReceive).to.have.been.calledWith({
      mustCollect: undefined,
      responseTime: 0,
      status: consts.EDGE_STATUS.OK,
      statusCode: 200,
      id: 'fakeTransactionId',
      spanId: 'fakeSpanId',
      host: 'fakeRedisAddress',
      time: 42,
      url: 'unknown',
      method: 'hset',
      protocol: consts.PROTOCOLS.REDIS
    })
  })

  it('should instument errors too', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var FakeRedis = function () {
      this.options = {
        host: 'fakeRedisAddress'
      }
    }

    var fakeAgent = {
      generateSpanId: function () { return 'fakeSpanId' },
      getMicrotime: function () { return 42 },
      getTransactionId: function () { return 'fakeTransactionId' },
      clientSend: this.sandbox.spy(),
      clientReceive: this.sandbox.spy(),
      CLIENT_SEND: 'fakeSend'
    }

    // wrapped as a side effect
    wrapper(FakeRedis, fakeAgent)
    var wrapOp = shimmerWrapStub.args[0][3]

    var rejectingPromise = {
      then: function (s, j) {
        j(new Error('error'))
      }
    }

    var fakeRedisClientSend = this.sandbox.spy(function (command) {
      return rejectingPromise
    })

    var fakeRedisCommand = { name: 'hset' }

    wrapOp(fakeRedisClientSend).call(new FakeRedis(), fakeRedisCommand)

    expect(fakeAgent.clientSend).to.have.been.calledOnce
    expect(fakeAgent.clientSend).to.have.been.calledWith({
      id: 'fakeTransactionId',
      spanId: 'fakeSpanId',
      host: 'fakeRedisAddress',
      time: 42,
      type: fakeAgent.CLIENT_SEND,
      url: 'unknown',
      method: 'hset'
    })

    expect(fakeAgent.clientReceive).to.have.been.calledOnce
    expect(fakeAgent.clientReceive).to.have.been.calledWith({
      mustCollect: consts.MUST_COLLECT.ERROR,
      responseTime: 0,
      status: consts.EDGE_STATUS.NOT_OK,
      statusCode: undefined,
      id: 'fakeTransactionId',
      spanId: 'fakeSpanId',
      host: 'fakeRedisAddress',
      time: 42,
      url: 'unknown',
      method: 'hset',
      protocol: consts.PROTOCOLS.REDIS
    })
  })
})
