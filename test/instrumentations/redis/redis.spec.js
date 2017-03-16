'use strict'

require('../test-setup.spec')

var sinon = require('sinon')
var expect = require('chai').expect
var Shimmer = require('../../../lib/utils/shimmer')
var Module = require('module')

describe.only('The redis wrapper module', function () {
  var sandbox = sinon.sandbox.create()
  var fakeAgent = {
    incomingEdgeMetrics: {
      report: sandbox.spy()
    },
    tracer: {
      collector: {
        mustCollectSeverity: 9,
        defaultSeverity: 0,
        clientRecv: sandbox.spy(),
        clientSend: sandbox.stub().returns({
          event: {
            p: 'dfasdfs'
          },
          duffelBag: {
            timestamp: 0
          }
        }),
        systemError: sandbox.spy()
      },
      send: sandbox.spy()
    },
    storage: {
      get: sandbox.spy()
    },
    externalEdgeMetrics: {
      report: sandbox.spy(),
      EDGE_STATUS: {
        OK: 1,
        NOT_OK: 0
      }
    }
  }
  var redis
  beforeEach(function () {
    sandbox.reset()
    require.cache = {}
    Shimmer.unwrap(Module, '_load')
    require('../../../lib/instrumentations').create({
      instrumentations: { redis: './trace-instrumentation-redis' },
      agent: fakeAgent
    })
    redis = require('redis')
  })

  it('should instrument regular commands', function (done) {
    redis.createClient().zadd('i', 1, 9, function (err) {
      if (err) {
        done(err)
      }
      expect(fakeAgent.tracer.collector.clientRecv).to.have.been.calledWith({
        protocol: 'redis',
        status: 'ok'
      })
      done()
    })
    expect(fakeAgent.tracer.collector.clientSend).to.have.been.calledOnce
  })

  it('should instrument multi commands', function (done) {
    redis.createClient().multi().zadd('i', 1, 9).exec(function (err) {
      if (err) {
        done(err)
      }
      expect(fakeAgent.tracer.collector.clientSend).to.have.been.calledOnce
      expect(fakeAgent.tracer.collector.clientRecv).to.have.been.calledWith({
        protocol: 'redis',
        status: 'ok'
      })
      done()
    })
  })
})
