'use strict'
var util = require('util')
var expect = require('chai').expect

var localPgUri = util.format(
  'postgres://%s:%s@localhost:5432/%s',
  process.env.PG_USER || process.env.USER,
  process.env.PG_PASSWORD,
  process.env.PG_DATABASE || 'trace-collector'
)

var pgOptions = {
  uri: process.env.PG_URI || localPgUri,
  pool: {
    min: 1,
    max: 2
  }
}

describe('Pg-cls', function () {
  it('inserts a new row', function (done) {
    var ns = this.ns
    var pg = require('pg')
    var value = Math.random()
    var key = 'Model#find-cb'

    ns.run(function () {
      ns.set(key, value)

      pg.connect(pgOptions.uri, function (err, client, releaseCon) {
        if (err) {
          return done(err)
        }
        client.query('SELECT $1::int AS number', ['1'], function (err, result) {
          releaseCon()
          if (err) {
            return done(err)
          }
          expect(ns.get(key)).to.eql(value)
          done()
        })
      })
    })
  })
})
