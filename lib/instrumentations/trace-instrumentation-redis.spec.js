'use strict'

var expect = require('chai').expect
var flatMap = require('lodash.flatmap')
var wrapper = require('./trace-instrumentation-redis')
var utils = require('./utils')
var Shimmer = require('../utils/shimmer')
var redisCommands = require('./utils').redisTools.instrumentedCommands
var eql = require('deep-eql')

var instrumentedCommands = flatMap(Object.keys(redisCommands), function (key) {
  return redisCommands[key]
})

describe('The redis wrapper module', function () {
  describe('redis postload hook', function () {
    it('should call Shimmer.wrap with expected arguments', function () {
      var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

      var fakeRedis = {
        RedisClient: function () {}
      }

      // wrapped as a side effect
      wrapper.instrumentations[0].post(fakeRedis, null, {
        version: '2.0.0'
      })

      expect(shimmerWrapStub).to.have.been.calledWith(fakeRedis.RedisClient.prototype, instrumentedCommands)
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

      var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap').callsFake(function (nodule, name, cb) {
        if (nodule === fakeRedis.RedisClient.prototype && eql(name, instrumentedCommands)) {
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
      wrapper.instrumentations[0].post(fakeRedis, fakeAgent, {
        version: '2.0.0'
      })

      expect(shimmerWrapStub).to.have.been.calledWith(fakeRedis.RedisClient.prototype, instrumentedCommands)
    })
  })
  describe('lib/multi postload hook', function () {
    it('should call Shimmer.wrap with expected arguments', function () {
      var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

      var FakeMulti = function () {}

      // wrapped as a side effect
      wrapper.instrumentations[1].post(FakeMulti, null, {
        version: '2.0.0'
      })

      expect(shimmerWrapStub).to.have.been.calledWith(FakeMulti.prototype, ['exec', 'EXEC', 'exec_transaction'])

      expect(shimmerWrapStub).to.have.been.calledWith(FakeMulti.prototype, instrumentedCommands)
    })

    it('should record multi commands', function () {
      var fakeAgent = { }

      var fakeRedis = {
        RedisClient: function () {
          this.address = 'fakeRedisAddress'
        }
      }

      var FakeMulti = function (client) {
        this._client = client
      }

      var fakeZaddCommand = this.sandbox.spy()

      var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap').callsFake(function (nodule, name, cb) {
        if (nodule === FakeMulti.prototype && eql(name, instrumentedCommands)) {
          expect(cb).to.be.a('function')
          var multiInstance = new FakeMulti(new fakeRedis.RedisClient())
          var commandArguments = ['mySortedSet', 42]
          cb(fakeZaddCommand, 'zadd').apply(multiInstance, commandArguments)
          expect(multiInstance.__trace).to.eql(['zadd'])
        }
      })

      // wrapped as a side effect
      wrapper.instrumentations[1].post(FakeMulti, fakeAgent)

      expect(shimmerWrapStub).to.have.been.calledWith(FakeMulti.prototype, instrumentedCommands)
    })

    it('should wrap multi.exec to call wrapQuery', function () {
      var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
      var sandbox = this.sandbox
      var fakeAgent = { }

      var fakeRedis = {
        RedisClient: function () {
          this.address = 'fakeRedisAddress'
        }
      }

      var FakeMulti = function (client) {
        this._client = client
      }
      var fakeExecCommand = this.sandbox.spy()

      var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap').callsFake(function (nodule, name, cb) {
        if (nodule === FakeMulti.prototype && name === 'exec') {
          expect(cb).to.be.a('function')
          var multiInstance = new FakeMulti(new fakeRedis.RedisClient())
          multiInstance.__trace = ['sadd', 'zrem', 'info']
          cb(fakeExecCommand, 'exec').apply(multiInstance)
          expect(fakeWrapQuery).to.have.been.calledWith(
            fakeExecCommand,
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
      wrapper.instrumentations[1].post(FakeMulti, fakeAgent)

      expect(shimmerWrapStub).to.have.been.calledWith(FakeMulti.prototype, ['exec', 'EXEC', 'exec_transaction'])
    })

    it('should wrap multi.exec to call wrapQuery, doesn\'t throw if there is nothing recorded', function () {
      var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
      var sandbox = this.sandbox
      var fakeAgent = { }

      var fakeRedis = {
        RedisClient: function () {
          this.address = 'fakeRedisAddress'
        }
      }

      var FakeMulti = function (client) {
        this._client = client
      }
      var fakeExecCommand = this.sandbox.spy()

      var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap').callsFake(function (nodule, name, cb) {
        if (nodule === FakeMulti.prototype && name === 'exec') {
          expect(cb).to.be.a('function')
          var multiInstance = new FakeMulti(new fakeRedis.RedisClient())
          cb(fakeExecCommand, 'exec').apply(multiInstance)
          expect(fakeWrapQuery).to.have.been.calledWith(
            fakeExecCommand,
            [],
            fakeAgent,
            {
              continuationMethod: 'callback',
              host: 'fakeRedisAddress',
              method: 'multi',
              protocol: 'redis',
              url: 'unknown'
            })
        }
      })

      // wrapped as a side effect
      wrapper.instrumentations[1].post(FakeMulti, fakeAgent)

      expect(shimmerWrapStub).to.have.been.calledWith(FakeMulti.prototype, ['exec', 'EXEC', 'exec_transaction'])
    })
  })
})
