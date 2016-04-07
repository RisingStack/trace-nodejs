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

  it.only('should instrument JS query', function (done) {
    var agent = fakeAgent(this.sandbox)
    var pg = wrap(require('pg'), agent)

    var conString = 'postgres://localhost/postgres'
    var qryString = 'SELECT 1 AS "one"'

    var client = new pg.Client(conString)
    client.connect(function (err) {
      if (err) {
        return console.error('could not connect to postgres', err)
      }
      client.query(qryString, function (err, result) {
        if (err) {
          return console.error('error running query', err)
        }
        expect(result.rows[0].one).to.eql(1)
        expect(agent.clientReceive).to.have.been.called
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

  it.only('should instrument JS query w/o callback', function (done) {
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
        return console.error('could not connect to postgres', err)
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

  it.only('should instrument native query', function (done) {
    var agent = fakeAgent(this.sandbox)
    var pg = wrap(require('pg'), agent, require('pg/package.json')).native

    var conString = 'postgres://localhost/postgres'
    var qryString = 'SELECT 1 AS "one"'

    var client = new pg.Client(conString)
    client.connect(function (err) {
      if (err) {
        return console.error('could not connect to postgres', err)
      }
      client.query(qryString, function (err, result) {
        if (err) {
          return console.error('error running query', err)
        }
        expect(result.rows[0].one).to.eql(1)
        expect(agent.clientReceive).to.have.been.called
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
