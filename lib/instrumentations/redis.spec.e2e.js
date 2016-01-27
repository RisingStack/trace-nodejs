'use strict'
var cls = require('continuation-local-storage')
var ns = cls.createNamespace('app')

var expect = require('chai').expect

describe('Redis-cls', function () {
  it('gets a key', function (done) {
    require('./').instrument(ns)
    var Redis = require('redis')
    var redis = Redis.createClient()
    var value = 'value'
    var key = 'redis#get'

    ns.run(function () {
      ns.set(key, value)

      redis.get('foo', function (err, result) {
        if (err) {
          return done(err)
        }
        expect(ns.get(key)).to.eql(value)
        done()
      })
    })
  })
})
