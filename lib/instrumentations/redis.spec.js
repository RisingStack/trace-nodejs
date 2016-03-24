'use strict'

var expect = require('chai').expect
var wrapper = require('./redis')
var Shimmer = require('../utils/shimmer')
var consts = require('../consts')

describe('The redis wrapper module', function () {
  it('should wrap redis.RedisClient.prototype.send_command', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var fakeRedis = {
      RedisClient: function () { }
    }

    // wrapped as a side effect
    wrapper(fakeRedis, null)

    expect(shimmerWrapStub).to.have.been.calledWith(
      fakeRedis.RedisClient.prototype,
      'redis.RedisClient.prototype',
      'send_command'
    )
  })

  it('should call clientSend on the Agent when command is sent', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var fakeRedis = {
      RedisClient: function () {
        this.address = 'fakeRedisAddress'
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
    wrapper(fakeRedis, fakeAgent)
    var wrapOp = shimmerWrapStub.args[0][3]

    var fakeRedisClientSend = this.sandbox.spy(function (command, args, callback) {
      callback() // simulate the response
    })

    wrapOp(fakeRedisClientSend).apply(new fakeRedis.RedisClient(), ['hset', ['abc', 'def']])

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

  it('should instrument errors too', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var fakeRedis = {
      RedisClient: function () {
        this.address = 'fakeRedisAddress'
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
    wrapper(fakeRedis, fakeAgent)
    var wrapOp = shimmerWrapStub.args[0][3]

    var fakeRedisClientSend = this.sandbox.spy(function (command, args, callback) {
      callback(new Error('error')) // simulate the response
    })

    wrapOp(fakeRedisClientSend).apply(new fakeRedis.RedisClient(), ['hset', ['abc', 'def']])

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
