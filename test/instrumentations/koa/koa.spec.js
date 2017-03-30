'use strict'

require('../test-setup.spec')

var sinon = require('sinon')
var http = require('http')
var expect = require('chai').expect
var Shimmer = require('../../../lib/utils/shimmer')
var Module = require('module')

describe('The koa wrapper module', function () {
  var sandbox = sinon.sandbox.create()
  var fakeAgent = {
    tracer: {
      collector: {
        userSentError: sandbox.spy()
      }
    }
  }
  var koa
  beforeEach(function () {
    sandbox.reset()
    require.cache = {}
    Shimmer.unwrap(Module, '_load')
    require('../../../lib/instrumentations').create({
      instrumentations: { redis: './trace-instrumentation-koa' },
      agent: fakeAgent
    })
    koa = require('koa')
  })
  it('reports unhandled errors', function () {
    var app = koa()
    app.use(function * (next) {
      throw new Error('But you shouldn\'t worry about it.')
      // yield next
    })
    app.listen(3000)
    http.get('http://localhost:3000', function () {
      expect(fakeAgent.tracer.collector.userSentError).to.have.been.calledOnce
    })
  })
})
