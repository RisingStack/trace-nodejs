'use strict'
var cls = require('continuation-local-storage')
var ns = cls.createNamespace('app')

var expect = require('chai').expect
/*

  1. make sure you have cassandra running
  2. open the cassandra shell with `cqlsh`
  3. create a keyspace:
     ```
     CREATE KEYSPACE mykeyspace
     WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };
     ```
  4. use the keyspace `USE mykeyspace;`
  5. create a table
     ```
     CREATE TABLE user_profiles (
       user_id text PRIMARY KEY,
       fname text,
       lname text
     );
     ```
 */
describe('Cassandra-cls', function () {
  it('gets a key', function (done) {
    var cassandra = require('cassandra-driver')
    var client = new cassandra.Client({
      contactPoints: ['localhost'],
      keyspace: 'mykeyspace'
    })
    var query = 'SELECT fname, lname FROM user_profiles WHERE user_id=?'
    var key = 'cassandra#execute'
    var value = 'cassandra'
    ns.run(function () {
      ns.set(key, value)
      client.execute(query, ['lofasz'], function (err, result) {
        if (err) {
          return done(err)
        }
        expect(ns.get(key)).to.eql(value)
        done()
      })
    })
  })
})
