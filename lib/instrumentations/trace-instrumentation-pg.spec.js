'use strict'

var wrapper = require('./trace-instrumentation-pg').instrumentations[0].post
var utils = require('./utils')
var Shimmer = require('../utils/shimmer')
var expect = require('chai').expect

describe('pg instrumentation', function () {
  it('should wrap pg.Client.query', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')
    var fakePg = {
      Client: function () {}
    }

    // wrapped as a side effect
    wrapper(fakePg, null)

    expect(shimmerWrapStub).to.have.been.calledWith(
      fakePg.Client.prototype,
      'query'
    )
  })

  it('should wrap pg.native.Client.query', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')
    var fakePg = {
      native: { Client: function () {} },
      Client: function () {}
    }

    // wrapped as a side effect
    wrapper(fakePg, null)

    expect(shimmerWrapStub).to.have.been.calledWith(
      fakePg.native.Client.prototype,
      'query'
    )
  })

  it('should use wrapQuery to wrap', function () {
    var fakeWrapQuery = this.sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { clearly: 'a mock' }

    var FakeClient = function () {
      this.host = 'fakeHost'
      this.database = 'fakedb'
    }
    FakeClient.prototype.query = this.sandbox.spy()
    var fakeClient = new FakeClient()

    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap').callsFake(function (nodule, name, cb) {
      expect(cb).to.be.a('function')
      cb(fakeClient.query).call(fakeClient)
      expect(fakeWrapQuery).to.have.been.calledWith(fakeClient.query, [], fakeAgent)
    })

    var fakePg = { Client: FakeClient }

    // wrapped as a side effect
    wrapper(fakePg, fakeAgent)

    expect(shimmerWrapStub).to.have.been.called
  })
})
