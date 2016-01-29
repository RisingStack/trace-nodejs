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

describe('Bookshelf-cls', function () {
  it.only('retrieves a value using postgres', function (done) {
    var ns = this.ns
    var knex = require('knex')({
      client: 'pg',
      connection: pgOptions.uri
    })
    var bookshelf = require('bookshelf')(knex)

    const Model = bookshelf.Model.extend({
      tableName: 'pg_aggregate'
    })

    var value = Math.random()
    var key = 'Bookshelf#where'

    ns.run(function () {
      ns.set(key, value)
      Model.where('aggfnoid', 0).fetch()
        .then(function () {
          expect(ns.get(key)).to.eql(value)
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })
  })
})
