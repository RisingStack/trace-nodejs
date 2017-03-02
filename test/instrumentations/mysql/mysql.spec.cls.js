'use strict'
var expect = require('chai').expect

describe('Mysql-cls', function () {
  it('inserts a new row', function (done) {
    var ns = this.ns
    var mysql = require('mysql')
    var value = Math.random()
    var key = 'Mysql#query-cb'

    var connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'test'
    })

    connection.connect()

    ns.run(function () {
      ns.set(key, value)

      connection.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
        if (err) {
          return done(err)
        }

        expect(ns.get(key)).to.eql(value)
        done()
      })
    })
  })

  it('inserts a new row using a pool', function (done) {
    var ns = this.ns
    var mysql = require('mysql')
    var value = Math.random()
    var key = 'Mysql#query-cb-pool'

    var pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      database: 'test',
      connectionLimit: 10
    })

    ns.run(function () {
      ns.set(key, value)

      pool.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
        if (err) {
          return done(err)
        }

        expect(ns.get(key)).to.eql(value)
        done()
      })
    })
  })
})
