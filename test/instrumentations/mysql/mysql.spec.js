'use strict'

var wrapper = require('@risingstack/trace/lib/instrumentations/mysql')
var expect = require('chai').expect
var Shimmer = require('@risingstack/trace/lib/utils/shimmer')
var utils = require('@risingstack/trace/lib/instrumentations/utils')

describe('The mysql wrapper', function () {
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

  it('should wrap mysql.createConnection and mysql.createPool', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var mysql = require('mysql')

    wrapper(mysql, null)

    expect(shimmerWrapStub).to.have.been.calledTwice

    expect(shimmerWrapStub.getCall(0)).to.have.been.calledWith(
      mysql,
      'createConnection'
    )

    expect(shimmerWrapStub.getCall(1)).to.have.been.calledWith(
      mysql,
      'createPool'
    )
  })

  it('should use wrapQuery with expected arguments to wrap connection.query', function (done) {
    var sandbox = this.sandbox
    var fakeWrapQuery = sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { clearly: 'a mock' }

    var mysql = require('mysql')

    wrapper(mysql, fakeAgent)

    // This is tricky. We have to stub exactly after wrapping, and before
    // createConnection to catch the wrapping of the query operation
    var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      expect(name).to.eql(CONNECTION_OPERATIONS)
      nodule.connect(function (err) {
        if (err) {
          return console.error('could not connect to mysql: install mysql or check \'mysql -uroot\' in console', err)
        }
        var queryStr = 'SELECT 1 + 1 AS solution'
        var queryArguments = [queryStr]
        cb(nodule.query, 'query').apply(nodule, queryArguments)
        expect(fakeWrapQuery).to.have.been.calledWith(
          nodule.query,
          queryArguments,
          fakeAgent,
          {
            host: 'localhost',
            method: 'SELECT',
            protocol: 'mysql',
            url: 'mysql://root@localhost:3306/information_schema'
          })
        done()
      })
    })

    mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost', //
      user: process.env.MYSQL_USER || 'root', // these should be
      password: process.env.MYSQL_PASSWORD || '', // default install settings
      database: process.env.MYSQL_DATABASE || 'information_schema'
    })

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should use wrapQuery with expected arguments to wrap pool.query', function (done) {
    var sandbox = this.sandbox
    var fakeWrapQuery = sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { clearly: 'a mock' }

    var mysql = require('mysql')

    wrapper(mysql, fakeAgent)

    // This is tricky. We have to stub exactly after wrapping, and before
    // createConnection to catch the wrapping of the query operation
    var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
      expect(name).to.eql(POOL_OPERATIONS)
      var queryStr = 'SELECT 1 + 1 AS solution'
      var queryArguments = [queryStr]
      cb(nodule.query, 'query').apply(nodule, queryArguments)
      expect(fakeWrapQuery).to.have.been.calledWith(
        nodule.query,
        queryArguments,
        fakeAgent,
        {
          host: 'localhost',
          method: 'SELECT',
          protocol: 'mysql',
          url: 'mysql://root@localhost:3306/information_schema'
        })
      done()
    })

    mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost', //
      user: process.env.MYSQL_USER || 'root', // these should be
      password: process.env.MYSQL_PASSWORD || '', // default install settings
      database: process.env.MYSQL_DATABASE || 'information_schema'
    })

    expect(shimmerWrapStub).to.have.been.called
  })

  it('should not leak credentials', function (done) {
    var sandbox = this.sandbox
    var fakeWrapQuery = sandbox.stub(utils, 'wrapQuery')
    var fakeAgent = { clearly: 'a mock' }

    var mysql = require('mysql')

    wrapper(mysql, fakeAgent)

    // This is tricky. We have to stub exactly after wrapping, and before
    // createConnection to catch the wrapping of the query operation
    var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, path, name, cb) {
      expect(name).to.eql(CONNECTION_OPERATIONS)
      nodule.connect(function (err) {
        if (err) {
          console.error('could not connect to mysql: install mysql or check \'mysql -uroot\' in console', err)
          expect(err).to.not.exist
          done()
        }
        var queryStr = 'SELECT 1 + 1 AS solution'
        var queryArguments = [queryStr]
        cb(nodule.query, 'query').apply(nodule, queryArguments)
        expect(fakeWrapQuery).to.have.been.calledWith(
          nodule.query,
          queryArguments,
          fakeAgent,
          {
            host: 'localhost',
            method: 'SELECT',
            protocol: 'mysql',
            url: 'mysql://password_test@localhost:3306/information_schema'
          })
        done()
      })
    })

    mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost', //
      user: process.env.MYSQL_USER || 'password_test', // these should be
      password: process.env.MYSQL_PASSWORD || 'password', // default install settings
      database: process.env.MYSQL_DATABASE || 'information_schema'
    })

    expect(shimmerWrapStub).to.have.been.called
  })
})
