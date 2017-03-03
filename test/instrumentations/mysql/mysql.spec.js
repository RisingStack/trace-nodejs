'use strict'

require('../test-setup.spec.js')

var wrapper = require('../../../lib/instrumentations/trace-instrumentation-mysql')
var expect = require('chai').expect
var Shimmer = require('../../../lib/utils/shimmer')
var utils = require('../../../lib/instrumentations/utils')

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

  describe('Connection', function () {
    it('should wrap var connection = mysql.createConnection and var connection = mysql.createPool', function () {
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
  })
  describe('Callback api', function () {
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
          expect(err).to.not.exist
          var queryStr = 'SELECT 1 + 1 AS solution'
          var queryArguments = [queryStr, function queryCallback () {}]
          cb(connection.query, 'query').apply(nodule, queryArguments)
          expect(fakeWrapQuery).to.have.been.calledWith(
            connection.query,
            queryArguments,
            fakeAgent,
            {
              continuationMethod: 'callback',
              host: 'localhost:3306/information_schema',
              method: 'SELECT',
              protocol: 'mysql',
              url: 'mysql://root@localhost:3306/information_schema'
            })
          done()
        })
      })

      var connection = mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost', //
        user: 'root',
        password: '',
        database: 'information_schema'
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
        var queryArguments = [queryStr, function queryCallback () {}]
        cb(nodule.query, 'query').apply(nodule, queryArguments)
        expect(fakeWrapQuery).to.have.been.calledWith(
          nodule.query,
          queryArguments,
          fakeAgent,
          {
            continuationMethod: 'callback',
            host: 'localhost:3306/information_schema',
            method: 'SELECT',
            protocol: 'mysql',
            url: 'mysql://root@localhost:3306/information_schema'
          })
        done()
      })

      mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost', //
        user: 'root',
        password: '',
        database: 'information_schema'
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
      var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
        expect(name).to.eql(CONNECTION_OPERATIONS)
        nodule.connect(function (err) {
          expect(err).to.not.exist
          var queryStr = 'SELECT 1 + 1 AS solution'
          var queryArguments = [queryStr, function queryCallback () {}]
          cb(connection.query, 'query').apply(nodule, queryArguments)
          expect(fakeWrapQuery).to.have.been.calledWith(
            connection.query,
            queryArguments,
            fakeAgent,
            {
              continuationMethod: 'callback',
              host: 'localhost:3306/information_schema',
              method: 'SELECT',
              protocol: 'mysql',
              url: 'mysql://password_test@localhost:3306/information_schema'
            })
          done()
        })
      })

      var connection = mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        user: 'password_test',
        password: 'secret',
        database: 'information_schema'
      })

      expect(shimmerWrapStub).to.have.been.called
    })
  })
  describe('EventEmitter api', function () {
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
          expect(err).to.not.exist

          var queryStr = 'SELECT 1 + 1 AS solution'
          var queryArguments = [queryStr]
          cb(connection.query, 'query').apply(nodule, queryArguments)
          expect(fakeWrapQuery).to.have.been.calledWith(
            connection.query,
            queryArguments,
            fakeAgent,
            {
              continuationMethod: 'eventEmitter',
              host: 'localhost:3306/information_schema',
              method: 'SELECT',
              protocol: 'mysql',
              url: 'mysql://root@localhost:3306/information_schema'
            })
          done()
        })
      })

      var connection = mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost', //
        user: 'root', // these should be
        password: '', // default install settings
        database: 'information_schema'
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
            continuationMethod: 'eventEmitter',
            host: 'localhost:3306/information_schema',
            method: 'SELECT',
            protocol: 'mysql',
            url: 'mysql://root@localhost:3306/information_schema'
          })
        done()
      })

      mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost', //
        user: 'root', // these should be
        password: '', // default install settings
        database: 'information_schema'
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
      var shimmerWrapStub = sandbox.stub(Shimmer, 'wrap', function (nodule, name, cb) {
        expect(name).to.eql(CONNECTION_OPERATIONS)
        nodule.connect(function (err) {
          expect(err).to.not.exist
          var queryStr = 'SELECT 1 + 1 AS solution'
          var queryArguments = [queryStr]
          cb(connection.query, 'query').apply(nodule, queryArguments)
          expect(fakeWrapQuery).to.have.been.calledWith(
            connection.query,
            queryArguments,
            fakeAgent,
            {
              continuationMethod: 'eventEmitter',
              host: 'localhost:3306/information_schema',
              method: 'SELECT',
              protocol: 'mysql',
              url: 'mysql://password_test@localhost:3306/information_schema'
            })
          done()
        })
      })

      var connection = mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost', //
        user: 'password_test', // these should be
        password: 'secret', // default install settings
        database: 'information_schema'
      })

      expect(shimmerWrapStub).to.have.been.called
    })
  })
})
