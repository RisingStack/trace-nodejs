'use strict'

var expect = require('chai').expect
var flatMap = require('lodash.flatmap')
var wrapper = require('../../../lib/instrumentations/redis')
var utils = require('../../../lib/instrumentations/utils')
var Shimmer = require('../../../lib/utils/shimmer')
var instrumentedCommands = require('../../../lib/instrumentations/utils').redisTools.instrumentedCommands

describe('The redis wrapper module', function () {
  // beforeEach(function () {
  //   delete require.cache[require.resolve('redis')]
  // })
  it('should call Shimmer.wrap with expected arguments', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var _instrumentedCommands = flatMap(Object.keys(instrumentedCommands), function (key) {
      return instrumentedCommands[key]
    })

    var redis = require('redis')

    // wrapped as a side effect
    wrapper(redis, null, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.calledWith(
      redis.RedisClient.prototype,
      _instrumentedCommands.concat(['multi'])
    )

    expect(shimmerWrapStub).to.have.been.calledWith(
      redis.Multi.prototype,
      _instrumentedCommands
    )
  })

  it('should call utils.wrapQuery with expected arguments for regular commands', function () {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { }

    var redis = require('redis')

    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      if (nodule === redis.RedisClient.prototype) {
        expect(cb).to.be.a('function')
        var redisInstance = redis.createClient()
        var commandArguments = ['mySortedSet', 42]
        cb(redisInstance.zadd, 'zadd').apply(redisInstance, commandArguments)
        expect(fakeWrapQuery).to.have.been.calledWith(
          redisInstance.zadd,
          commandArguments,
          fakeAgent,
          {
            continuationMethod: 'callback',
            host: '127.0.0.1:6379',
            method: 'zadd',
            protocol: 'redis',
            url: 'unknown'
          })
      }
    })

    // wrapped as a side effect
    wrapper(redis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should wrap RedisClient.multi to record commands', function () {
    var sandbox = this.sandbox
    var fakeAgent = { }

    var redis = require('redis')

    var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      if (nodule === redis.RedisClient.prototype) {
        expect(cb).to.be.a('function')
        var redisInstance = redis.createClient()
        var wrappedMulti = cb(redisInstance.multi, 'multi').call(redisInstance)
        expect(wrappedMulti.__trace).to.be.ok
      }
    })

    // wrapped as a side effect
    wrapper(redis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should wrap multi.exec to call wrapQuery', function () {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var sandbox = this.sandbox
    var fakeAgent = { }

    var redis = require('redis')

    var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      if (nodule === redis.RedisClient.prototype) {
        expect(cb).to.be.a('function')
        var redisInstance = redis.createClient()
        var originalExec = redisInstance.multi().exec // not elegant but works
        var multi = cb(redisInstance.multi, 'multi').apply(redisInstance)
        multi.__trace = ['sadd', 'zrem', 'info']
        multi.exec()
        expect(fakeWrapQuery).to.have.been.calledWith(
          originalExec,
          [],
          fakeAgent,
          {
            continuationMethod: 'callback',
            host: '127.0.0.1:6379',
            method: 'multi: sadd, zrem, info',
            protocol: 'redis',
            url: 'unknown'
          })
      }
    })

    // wrapped as a side effect
    wrapper(redis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should record regular commands on a Multi object', function () {
    var fakeAgent = { }

    var redis = require('redis')

    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      if (nodule === redis.Multi.prototype) {
        var redisInstance = redis.createClient()
        var multiInstance = redisInstance.multi()
        multiInstance.__trace = []
        var commandArguments = ['mySortedSet', 42]
        cb(multiInstance.zadd, 'zadd').apply(multiInstance, commandArguments)
        expect(multiInstance.__trace).to.eql(['zadd'])
      }
    })

    // wrapped as a side effect
    wrapper(redis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })
})
