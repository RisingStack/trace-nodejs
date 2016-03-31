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

  it.only('should instrument operation test #1', function (done) {
    var agent = fakeAgent(this.sandbox)
    var pg = wrap(require('pg'), agent)

    var conString = 'postgres://localhost/postgres'

    var client = new pg.Client(conString)
    client.connect(function (err) {
      if (err) {
        return console.error('could not connect to postgres', err)
      }
      client.query('SELECT NOW() AS "theTime"', function (err, result) {
        if (err) {
          return console.error('error running query', err)
        }
        console.log(result.rows[0].theTime)
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
        method: 'SELECT NOW() AS "theTime"',
        type: 'fakeSend',
        url: 'postgres'
      })
    })
  })
})
