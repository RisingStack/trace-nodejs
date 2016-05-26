'use strict'

var flatMap = require('lodash.flatmap')
var expect = require('chai').expect
var wrapper = require('./ioredis')
var Shimmer = require('../utils/shimmer')
var utils = require('./utils')
var instrumentedCommands = utils.redisTools.instrumentedCommands

describe('ioredis module wrapper', function () {
  beforeEach(function () {
    Shimmer.unwrapAll()
  })

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
      redis.prototype,
      'redis.prototype',
      _instrumentedCommands
    )
  })
  it('should call utils.wrapQuery with expected arguments for regular commands with promise', function () {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { }

    var Redis = require('ioredis')

    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap', function (nodule, path, name, cb) {
      expect(cb).to.be.a('function')
      var redisInstance = new Redis()
      var commandArguments = ['mySortedSet', 42]
      cb(redisInstance.zadd, 'zadd').apply(redisInstance, commandArguments)
      expect(fakeWrapQuery).to.have.been.calledWith(
        redisInstance.zadd,
        commandArguments,
        fakeAgent,
        {
          host: 'localhost:6379',
          method: 'zadd',
          protocol: 'redis',
          url: 'unknown',
          returnsPromise: true
        })
    })

    // wrapped as a side effect
    wrapper(Redis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should call utils.wrapQuery with expected arguments for regular commands with callback', function () {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { }

    var Redis = require('ioredis')

    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap', function (nodule, path, name, cb) {
      expect(cb).to.be.a('function')
      var redisInstance = new Redis()
      var dummyCallback = function () {}
      var commandArguments = ['mySortedSet', 42, dummyCallback]
      cb(redisInstance.zadd, 'zadd').apply(redisInstance, commandArguments)
      expect(fakeWrapQuery).to.have.been.calledWith(
        redisInstance.zadd,
        commandArguments,
        fakeAgent,
        {
          host: 'localhost:6379',
          method: 'zadd',
          protocol: 'redis',
          url: 'unknown',
          returnsPromise: false
        })
    })

    // wrapped as a side effect
    wrapper(Redis, fakeAgent, {
      version: '2.0.0'
    })

    expect(shimmerWrapStub).to.have.been.called
  })
})
