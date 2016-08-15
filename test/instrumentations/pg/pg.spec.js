'use strict'

var expect = require('chai').expect
var wrapper = require('@risingstack/trace/lib/instrumentations/pg')
var Shimmer = require('@risingstack/trace/lib/utils/shimmer')
var utils = require('@risingstack/trace/lib/instrumentations/utils')

describe('pg module wrapper', function () {
  beforeEach(function () {
    Shimmer.unwrapAll()
  })
  it('should wrap pg.Client.query', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var pg = require('pg')

    // wrapped as a side effect
    wrapper(pg, null)

    expect(shimmerWrapStub).to.have.been.calledWith(
      pg.Client.prototype,
      'pg.Client.prototype',
      'query'
    )
  })

  it('should use wrapQuery with expected arguments to wrap Client.query', function (done) {
    var sandbox = this.sandbox
    var fakeWrapQuery = sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { clearly: 'a mock' }

    var pg = require('pg')
    var conString = 'postgres://localhost/postgres'
    var qryString = 'SELECT 1 AS \'one\''
    var client = new pg.Client(conString)

    client.connect(function (err) {
      if (err) {
        console.error(err)
        throw err
      }

      var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, path, name, cb) {
        expect(cb).to.be.a('function')
        var qryArguments = [qryString]
        cb(client.query).apply(client, qryArguments)
        expect(fakeWrapQuery).to.have.been.calledWith(
          client.query,
          qryArguments,
          fakeAgent,
          {
            host: 'localhost',
            method: 'SELECT',
            protocol: 'pg',
            url: 'postgres'
          })
      })

      // wrapped as a side effect
      wrapper(pg, fakeAgent)

      expect(shimmerWrapStub).to.have.been.called
      done()
    })
  })

  it('should use wrapQuery with expected arguments to wrap native.Client.query', function (done) {
    var sandbox = this.sandbox
    var fakeWrapQuery = sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { clearly: 'a mock' }

    var pg = require('pg')
    var conString = 'postgres://localhost/postgres'
    var qryString = 'SELECT 1 AS \'one\''
    var client = new pg.native.Client(conString)

    client.connect(function (err) {
      if (err) {
        console.error(err)
        throw err
      }

      var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, path, name, cb) {
        expect(cb).to.be.a('function')
        var qryArguments = [qryString]
        cb(client.query).apply(client, qryArguments)
        expect(fakeWrapQuery).to.have.been.calledWith(
          client.query,
          qryArguments,
          fakeAgent,
          {
            host: 'localhost',
            method: 'SELECT',
            protocol: 'pg',
            url: 'postgres'
          })
      })

      // wrapped as a side effect
      wrapper(pg, fakeAgent)

      expect(shimmerWrapStub).to.have.been.called
      done()
    })
  })
})
