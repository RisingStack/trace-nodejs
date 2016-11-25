'use strict'

var utils = require('./utils')
var wrapper = require('./mysql')
var Shimmer = require('../utils/shimmer')
var expect = require('chai').expect

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

describe('The mysql wrapper', function () {
  it('should wrap mysql.createConnection and mysql.createPool', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var fakeMySql = {
      createConnection: function () {},
      createPool: function () {}
    }

    wrapper(fakeMySql, null)

    expect(shimmerWrapStub).to.have.been.calledTwice

    expect(shimmerWrapStub.getCall(0)).to.have.been.calledWith(
      fakeMySql,
      'createConnection'
    )

    expect(shimmerWrapStub.getCall(1)).to.have.been.calledWith(
      fakeMySql,
      'createPool'
    )
  })

  it('should use wrapQuery with expected arguments to wrap connection.query', function (done) {
    var sandbox = this.sandbox
    var fakeWrapQuery = sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { clearly: 'a mock' }

    var fakeMySql = {
      createConnection: function () {
        return {
          config: {
            user: 'someone'
          }
        }
      },
      createPool: function () {
        return {
          config: {
            connectionConfig: {
              user: 'someone'
            }
          }
        }
      }
    }

    wrapper(fakeMySql, fakeAgent)

    // This is tricky. We have to stub exactly after wrapping, and before
    // createConnection to catch the wrapping of the query operation
    var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      expect(name).to.eql(CONNECTION_OPERATIONS)
      var queryStr = 'SELECT 1 + 1 AS solution'
      var queryArguments = [queryStr]
      var fakeQuery = function () {}
      cb(fakeQuery, 'query').apply(nodule, queryArguments)
      expect(fakeWrapQuery).to.have.been.calledWith(
        fakeQuery,
        queryArguments,
        fakeAgent,
        {
          host: 'unknown',
          method: 'SELECT',
          protocol: 'mysql',
          url: 'unknown'
        })
      done()
    })

    fakeMySql.createConnection()

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should use wrapQuery with expected arguments to wrap pool.query', function (done) {
    var sandbox = this.sandbox
    var fakeWrapQuery = sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { clearly: 'a mock' }

    var fakeMySql = {
      createConnection: function () { },
      createPool: function () {
        return {
          config: {
            connectionConfig: {
              user: 'someone'
            }
          }
        }
      }
    }

    wrapper(fakeMySql, fakeAgent)

    // This is tricky. We have to stub exactly after wrapping, and before
    // createConnection to catch the wrapping of the query operation
    var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      expect(name).to.eql(POOL_OPERATIONS)
      var queryStr = 'SELECT 1 + 1 AS solution'
      var queryArguments = [queryStr]
      var fakeQuery = function () {}
      cb(fakeQuery, 'query').apply(nodule, queryArguments)
      expect(fakeWrapQuery).to.have.been.calledWith(
        fakeQuery,
        queryArguments,
        fakeAgent,
        {
          host: 'unknown',
          method: 'SELECT',
          protocol: 'mysql',
          url: 'unknown'
        })
      done()
    })

    fakeMySql.createPool()

    expect(shimmerWrapStub).to.have.been.called
  })
})
