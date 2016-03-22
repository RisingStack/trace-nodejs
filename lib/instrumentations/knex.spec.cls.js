'use strict'

var util = require('util')
var expect = require('chai').expect

var localPgUri = util.format(
  'postgres://%s:%s@localhost:5432/%s',
  process.env.PG_USER || process.env.USER,
  process.env.PG_PASSWORD,
  process.env.PG_DATABASE || 'trace-collector'
)

var localMysqlUri = 'mysql://root:@localhost:3306/trace_test_service'

var pgOptions = {
  uri: process.env.PG_URI || localPgUri,
  pool: {
    min: 1,
    max: 2
  }
}

describe('Knex-cls', function () {
  it('retrieves a value using postgres', function (done) {
    var ns = this.ns
    var knex = require('knex')({
      client: 'pg',
      connection: pgOptions.uri
    })
    var value = Math.random()
    var key = 'Knex-pg#select'

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

  it('retrieves a value using mysql', function (done) {
    var ns = this.ns
    var knex = require('knex')({
      client: 'mysql',
      connection: localMysqlUri
    })

    var value = Math.random()
    var key = 'Knex-mysql#select'

    ns.run(function () {
      ns.set(key, value)
      knex
        .select('*')
        .from('test_table')
        .then(function (d) {
          expect(ns.get(key)).to.eql(value)
          done()
        })
        .catch(done)
    })
  })

  it('gets an error', function (done) {
    var ns = this.ns
    var knex = require('knex')({
      client: 'mysql',
      connection: localMysqlUri
    })

    var value = Math.random()
    var key = 'Knex-mysql#select'

    ns.run(function () {
      ns.set(key, value)
      knex
        .select('*')
        .from('non_exsisting_table')
        .then(function (d) {
          done(new Error('should not reach this'))
        })
        .catch(function () {
          expect(ns.get(key)).to.eql(value)
          done()
        })
    })
  })
})
