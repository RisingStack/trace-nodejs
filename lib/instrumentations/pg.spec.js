'use strict'

var cls = require('continuation-local-storage')
var util = require('util')
var ns = cls.createNamespace('app')
var expect = require('chai').expect

require('./')(ns)

var localPgUri = util.format(
  'postgres://%s:%s@localhost:5432/%s',
  process.env.PG_USER || process.env.USER,
  process.env.PG_PASSWORD,
  process.env.PG_DATABASE || 'trace-collector'
)

var pg = require('pg')

var pgOptions = {
  uri: process.env.PG_URI || localPgUri,
  pool: {
    min: 1,
    max: 2
  }
}

describe('Pg-cls', function () {
  it('inserts a new row', function (done) {
    var value = 'value'
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
