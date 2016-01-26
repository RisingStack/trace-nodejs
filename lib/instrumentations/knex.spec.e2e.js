'use strict'

var cls = require('continuation-local-storage')
var util = require('util')
var ns = cls.createNamespace('app')
var expect = require('chai').expect

// require('./')(ns)

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

var knex = require('knex')({
  client: 'pg',
  connection: pgOptions.uri
})

describe.skip('Knex-cls', function () {
  it('retrieves a value', function (done) {
    var value = 'value'
    var key = 'Knex#select'

    ns.run(function () {
      ns.set(key, value)
      knex
        .select('*')
        .from('pg_aggregate')
        .then(function (d) {
          expect(ns.get(key)).to.eql(value)
          done()
        })
        .catch(done)
    })
  })
})
