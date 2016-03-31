'use strict'

var expect = require('chai').expect
var wrap = require('./pg')
var Shimmer = require('../utils/shimmer')

function fakeAgent (sandbox) {
  return {
    generateSpanId: function () { return 'fakeSpanId' },
    getMicrotime: function () { return 42 },
    getTransactionId: function () { return 'fakeTransactionId' },
    clientSend: sandbox.spy(),
    clientReceive: sandbox.spy(),
    CLIENT_SEND: 'fakeSend'
  }
}

describe('pg module wrapper', function () {
  beforeEach(function () {
    Shimmer.unwrapAll()
  })

  it('should instrument JS query', function (done) {
    var agent = fakeAgent(this.sandbox)
    var pg = wrap(require('pg'), agent)

    var conString = 'postgres://localhost/postgres'
    var qryString = 'SELECT 1 AS "one"'

    var client = new pg.Client(conString)
    client.connect(function (err) {
      if (err) {
        console.error(err)
        throw err
      }
      client.query(qryString, function (err, result) {
        if (err) {
          console.error(err)
          throw err
        }
        expect(result.rows[0].one).to.eql(1)
        expect(agent.clientReceive).to.have.been.calledWith({
          host: 'localhost',
          id: 'fakeTransactionId',
          method: 'SELECT',
          mustCollect: undefined,
          protocol: 'pg',
          responseTime: 0,
          spanId: 'fakeSpanId',
          status: 0,
          statusCode: 200,
          time: 42,
          url: 'postgres'
        })
        client.end()
        done()
      })

      expect(agent.clientSend).to.have.been.called
      expect(agent.clientSend).to.have.been.calledWith({
        id: 'fakeTransactionId',
        spanId: 'fakeSpanId',
        host: 'localhost',
        time: 42,
        method: 'SELECT',
        type: 'fakeSend',
        url: 'postgres'
      })
    })
  })

  it('should instrument JS query w/o callback', function (done) {
    var agent = fakeAgent(this.sandbox)
    agent.clientReceive = this.sandbox.spy(function (options) {
      done()
    })
    var pg = wrap(require('pg'), agent)

    var conString = 'postgres://localhost/postgres'
    var qryString = 'SELECT 1 AS "one"'

    var client = new pg.Client(conString)
    client.connect(function (err) {
      if (err) {
        console.error(err)
        throw err
      }
      client.query(qryString)

      expect(agent.clientSend).to.have.been.called
      expect(agent.clientSend).to.have.been.calledWith({
        id: 'fakeTransactionId',
        spanId: 'fakeSpanId',
        host: 'localhost',
        time: 42,
        method: 'SELECT',
        type: 'fakeSend',
        url: 'postgres'
      })
    })
  })

  it('should instrument native query', function (done) {
    var agent = fakeAgent(this.sandbox)
    var pkg = require('pg/package.json')
    var pg = wrap(require('pg'), agent, pkg).native

    var conString = 'postgres://localhost/postgres'
    var qryString = 'SELECT 1 AS "one"'

    var client = new pg.Client(conString)
    client.connect(function (err) {
      if (err) {
        console.error(err)
        throw err
      }
      client.query(qryString, function (err, result) {
        if (err) {
          console.error(err)
          throw err
        }
        expect(result.rows[0].one).to.eql(1)
        expect(agent.clientReceive).to.have.been.calledWith({
          host: 'localhost',
          id: 'fakeTransactionId',
          method: 'SELECT',
          mustCollect: undefined,
          protocol: 'pg',
          responseTime: 0,
          spanId: 'fakeSpanId',
          status: 0,
          statusCode: 200,
          time: 42,
          url: 'postgres'
        })
        client.end()
        done()
      })

      expect(agent.clientSend).to.have.been.called
      expect(agent.clientSend).to.have.been.calledWith({
        id: 'fakeTransactionId',
        spanId: 'fakeSpanId',
        host: 'localhost',
        time: 42,
        method: 'SELECT',
        type: 'fakeSend',
        url: 'postgres'
      })
    })
  })
})
