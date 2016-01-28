'use strict'
var cls = require('continuation-local-storage')
var ns = cls.createNamespace('app')

var expect = require('chai').expect

describe('Memcached-cls', function () {
  it('gets a key', function (done) {
    var Memcached = require('memcached')
    var memcached = new Memcached('localhost:11211')
    var key = 'memcached#get'
    var value = 'memcached'
    ns.run(function () {
      ns.set(key, value)
      memcached.get('foo', function (err, data) {
        if (err) {
          return done(err)
        }
        expect(ns.get(key)).to.eql(value)
        done()
      })
    })
  })
})
