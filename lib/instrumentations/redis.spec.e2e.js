'use strict'
var expect = require('chai').expect

describe('Redis-cls', function () {
  it('gets a key', function (done) {
    var ns = this.ns
    var Redis = require('redis')
    var redis = Redis.createClient()
    var key = 'redis#get'
    var value = Math.random()

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
