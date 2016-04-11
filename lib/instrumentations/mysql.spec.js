'use strict'

var utils = require('./utils')
var wrap = require('./mysql')
var Shimmer = require('../utils/shimmer')
var expect = require('chai').expect

var fakeConfig = {
  config: {
    user: 'flop'
  }
}
var fakeConnection = { me: 'fakeConnection' }
var fakePool = { me: 'fakePool' }

var CONNECTION_OPERATIONS = [
  'connect',
  'query',
  'end'
]

var POOL_OPERATIONS = [
  'getConnection',
  'query',
  'destroy'
]

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

describe('The mysql wrapper', function () {
  it('should wrap mysql', function () {
    var fakeMysql = { }

    var agent = fakeAgent(this.sandbox)
    var wrappedFakeMysql = wrap(fakeMysql, agent)

    expect(wrappedFakeMysql.createPool).to.be.a('function')
    expect(wrappedFakeMysql.createConnection).to.be.a('function')
  })

  it('should wrap Connections', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var createConnectionStub = this.sandbox.stub()
    createConnectionStub.returns(fakeConnection)

    var fakeMysql = {
      createConnection: createConnectionStub
    }

    var agent = fakeAgent(this.sandbox)
    var wrappedFakeMysql = wrap(fakeMysql, agent)

    wrappedFakeMysql.createConnection(fakeConfig)

    expect(createConnectionStub).to.have.been.calledOnce
    expect(createConnectionStub).to.have.been.calledWith(fakeConfig)

    expect(shimmerWrapStub).to.have.been.calledOnce
    expect(shimmerWrapStub).to.have.been.calledWith(
      fakeConnection,
      'Connection',
      CONNECTION_OPERATIONS
    )
  })

  it('should wrap Pools', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var createPoolStub = this.sandbox.stub()
    createPoolStub.returns(fakePool)

    var fakeMysql = {
      createPool: createPoolStub
    }

    var agent = fakeAgent(this.sandbox)
    var wrappedFakeMysql = wrap(fakeMysql, agent)

    wrappedFakeMysql.createPool(fakeConfig)

    expect(createPoolStub).to.have.been.calledOnce
    expect(createPoolStub).to.have.been.calledWith(fakeConfig)

    expect(shimmerWrapStub).to.have.been.calledOnce
    expect(shimmerWrapStub).to.have.been.calledWith(
      fakePool,
      'Pool',
      POOL_OPERATIONS
    )
  })

  it('should use wrapQuery to wrap query function', function (done) {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var agent = fakeAgent(this.sandbox)
    var queryStub = this.sandbox.stub()

    var fakeMysql = {
      createConnection: function () {
        return {
          config: fakeConfig,
          query: queryStub
        }
      }
    }
    var wrappedFakeMysql = wrap(fakeMysql, agent)
    this.sandbox.stub(Shimmer, 'wrap', function (nodule, path, name, cb) {
      cb(queryStub, 'query').call({ config: fakeConfig })
      expect(fakeWrapQuery).to.have.been.calledWith(queryStub, [], agent)
      done()
    })
    wrappedFakeMysql.createConnection(fakeConfig)
  })
})
