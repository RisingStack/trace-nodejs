'use strict'

var expect = require('chai').expect
var wrap = require('./redis')
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

describe('redis module wrapper', function () {
  beforeEach(function () {
    Shimmer.unwrapAll()
  })

  it('should instrument operation test #1', function (done) {
    var agent = fakeAgent(this.sandbox)
    var redis = wrap(require('redis'), agent)
    var client = redis.createClient(REDIS_URL)

    client.sadd('x', 6, function () {
      expect(agent.clientReceive).to.have.been.called
      done()
    })

    expect(agent.clientSend).to.have.been.called
    expect(agent.clientSend).to.have.been.calledWith({
      id: 'fakeTransactionId',
      spanId: 'fakeSpanId',
      host: '127.0.0.1:6379',
      time: 42,
      method: 'sadd',
      type: 'fakeSend',
      url: ''
    })
  })

  it('should instrument operation test #2', function () {
    var agent = fakeAgent(this.sandbox)
    var redis = wrap(require('redis'), agent)
    var client = redis.createClient(REDIS_URL)

    for (var i = 0; i < 9; ++i) {
      client.sadd('x', i)
    }

    expect(agent.clientSend).to.have.callCount(i)
  })

  it('should work with multi', function (done) {
    var agent = fakeAgent(this.sandbox)
    var redis = wrap(require('redis'), agent)

    var client = redis.createClient(REDIS_URL)

    client.multi()
      .sadd('x', 6)
      .srem('x', 7)
      .exec(function () {
        expect(agent.clientReceive).to.have.been.called
        done()
      })

    expect(agent.clientSend).to.have.callCount(4)
  })
})
