'use strict'
var expect = require('chai').expect

describe('IO Redis-cls', function () {
  it('gets a key', function (done) {
    var ns = this.ns
    var Redis = require('ioredis')
    var redis = new Redis()
    var value = Math.random()
    var key = 'ioredis#get'

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
