'use strict'

var expect = require('chai').expect
var flatMap = require('lodash.flatmap')
var wrapper = require('./trace-instrumentation-redis')
var utils = require('./utils')
var Shimmer = require('../utils/shimmer')
var instrumentedCommands = require('./utils').redisTools.instrumentedCommands

describe('The redis wrapper module', function () {
  it('should call Shimmer.wrap with expected arguments', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var _instrumentedCommands = flatMap(Object.keys(instrumentedCommands), function (key) {
      return instrumentedCommands[key]
    })

    var fakeRedis = {
      RedisClient: function () {},
      Multi: function () {}
    }

    // wrapped as a side effect
    wrapper(fakeRedis, null, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.calledWith(
      fakeRedis.RedisClient.prototype,
      _instrumentedCommands.concat(['multi'])
    )

    expect(shimmerWrapStub).to.have.been.calledWith(
      fakeRedis.Multi.prototype,
      _instrumentedCommands
    )
  })

  it('should call utils.wrapQuery with expected arguments for regular commands', function () {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { }

    var fakeRedis = {
      RedisClient: function () {
        this.address = 'fakeRedisAddress'
      },
      Multi: function () {}
    }
    var fakeZaddCommand = this.sandbox.spy()

    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      if (nodule === fakeRedis.RedisClient.prototype) {
        expect(cb).to.be.a('function')
        var redisInstance = new fakeRedis.RedisClient()
        var commandArguments = ['mySortedSet', 42]
        cb(fakeZaddCommand, 'zadd').apply(redisInstance, commandArguments)
        expect(fakeWrapQuery).to.have.been.calledWith(
          fakeZaddCommand,
          commandArguments,
          fakeAgent,
          {
            continuationMethod: 'callback',
            host: 'fakeRedisAddress',
            method: 'zadd',
            protocol: 'redis',
            url: 'unknown'
          })
      }
    })

    // wrapped as a side effect
    wrapper(fakeRedis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should wrap RedisClient.multi to record commands', function () {
    var sandbox = this.sandbox
    var fakeAgent = { }

    var fakeRedis = {
      RedisClient: function () {},
      Multi: function () { }
    }
    var fakeMulti = function () {
      return new fakeRedis.Multi()
    }

    var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      if (nodule === fakeRedis.RedisClient.prototype) {
        expect(cb).to.be.a('function')
        var multi = cb(fakeMulti, 'multi').call(new fakeRedis.RedisClient())
        expect(multi.__trace).to.be.ok
      }
    })

    // wrapped as a side effect
    wrapper(fakeRedis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should wrap multi.exec to call wrapQuery', function () {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var sandbox = this.sandbox
    var fakeAgent = { }

    var fakeRedis = {
      RedisClient: function () {
        this.address = 'fakeRedisAddress'
      },
      Multi: function () {}
    }
    var fakeExec = 'not even a function'
    var fakeMulti = function () {
      return {
        exec: fakeExec
      }
    }

    var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      if (nodule === fakeRedis.RedisClient.prototype) {
        expect(cb).to.be.a('function')
        var multi = cb(fakeMulti, 'multi').apply(new fakeRedis.RedisClient())
        multi.__trace = ['sadd', 'zrem', 'info']
        multi.exec()
        expect(fakeWrapQuery).to.have.been.calledWith(
          fakeExec,
          [],
          fakeAgent,
          {
            continuationMethod: 'callback',
            host: 'fakeRedisAddress',
            method: 'multi: sadd, zrem, info',
            protocol: 'redis',
            url: 'unknown'
          })
      }
    })

    // wrapped as a side effect
    wrapper(fakeRedis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should record regular commands on a Multi object', function () {
    var fakeAgent = { }

    var fakeRedis = {
      RedisClient: function () {},
      Multi: function () {}
    }
    var fakeZaddCommand = this.sandbox.spy()

    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      if (nodule === fakeRedis.Multi.prototype) {
        var multiInstance = new fakeRedis.Multi()
        multiInstance.__trace = []
        var commandArguments = ['mySortedSet', 42]
        cb(fakeZaddCommand, 'zadd').apply(multiInstance, commandArguments)
        expect(multiInstance.__trace).to.eql(['zadd'])
      }
    })

    // wrapped as a side effect
    wrapper(fakeRedis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })
})
