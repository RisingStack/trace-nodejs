'use strict'

var expect = require('chai').expect
var wrapper = require('./mongodb')
var Shimmer = require('../utils/shimmer')
var utils = require('./utils')

describe('The mongodb wrapper module', function () {
  it('should wrap collection\'s operations', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var fakeMongo = {
      Collection: { }
    }

    // wrapped as a side effect
    wrapper(fakeMongo, null)

    expect(shimmerWrapStub).to.have.been.calledWith(
      fakeMongo.Collection.prototype,
      'mongodb.Collection.prototype',
      wrapper._COLLECTION_OPERATIONS
    )
  })

  it('should call utils.wrapQuery with expected arguments for master', function () {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { }

    var fakeMongo = {
      Collection: {
        db: {
          serverConfig: {
            host: 'fakeHost',
            port: 666
          }
        }
      }
    }

    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap', function (nodule, path, name, cb) {
      expect(cb).to.be.a('function')
      var commandArguments = ['find', {x: 5}]
      var fakeFind = 'not even a function'
      cb(fakeFind, 'find').apply(fakeMongo.Collection, commandArguments)
      expect(fakeWrapQuery).to.have.been.calledWith(
        fakeFind,
        commandArguments,
        fakeAgent,
        {
          host: 'fakeHost:666',
          method: 'find',
          protocol: 'mongodb',
          url: 'unknown'
        })
    })

    // wrapped as a side effect
    wrapper(fakeMongo, fakeAgent)

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should call utils.wrapQuery with expected arguments for slave', function () {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { }

    var fakeMongo = {
      Collection: {
        s: {
          topology: {
            host: 'fakeHost',
            port: 666
          }
        }
      }
    }

    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap', function (nodule, path, name, cb) {
      expect(cb).to.be.a('function')
      var commandArguments = ['find', {x: 5}]
      var fakeFind = 'not even a function'
      cb(fakeFind, 'find').apply(fakeMongo.Collection, commandArguments)
      expect(fakeWrapQuery).to.have.been.calledWith(
        fakeFind,
        commandArguments,
        fakeAgent,
        {
          host: 'fakeHost:666',
          method: 'find',
          protocol: 'mongodb',
          url: 'unknown'
        })
    })

    // wrapped as a side effect
    wrapper(fakeMongo, fakeAgent)

    expect(shimmerWrapStub).to.have.been.called
  })
})
