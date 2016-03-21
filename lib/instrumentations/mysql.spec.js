'use strict'

var mysql = require('./mysql')
var Shimmer = require('../utils/shimmer')
var expect = require('chai').expect

var CONNECTION_OPERATIONS = [
  'connect',
  'query'
]

var POOL_OPERATIONS = [
  'getConnection'
]

describe('The mysql wrapper', function () {
  it('should wrap mysql', function () {
    var fakeMysql = { }

    var wrappedFakeMysql = mysql(fakeMysql, null)

    expect(wrappedFakeMysql.createPool).to.be.a('function')
    expect(wrappedFakeMysql.createConnection).to.be.a('function')
  })

  it('should wrap Connections', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var fakeConfig = { me: 'fakeConfig' }

    var fakeConnection = { me: 'fakeConnection' }

    var createConnectionStub = this.sandbox.stub()
    createConnectionStub.returns(fakeConnection)

    var fakeMysql = {
      createConnection: createConnectionStub
    }

    var wrappedFakeMysql = mysql(fakeMysql, null)

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

    var fakeConfig = { me: 'fakeConfig' }

    var fakePool = { me: 'fakePool' }

    var createPoolStub = this.sandbox.stub()
    createPoolStub.returns(fakePool)

    var fakeMysql = {
      createPool: createPoolStub
    }

    var wrappedFakeMysql = mysql(fakeMysql, null)

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
})
