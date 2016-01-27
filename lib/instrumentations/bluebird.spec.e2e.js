'use strict'
var cls = require('continuation-local-storage')
var ns = cls.createNamespace('app')

var expect = require('chai').expect

describe('Bluebird-cls', function () {
  it('resolves', function (done) {
    var bluebird = require('bluebird')
    var value = 'value'
    var key = 'bluebird#resolve'

    ns.run(function () {
      ns.set(key, value)
      bluebird.resolve()
        .then(function () {
          expect(ns.get(key)).to.eql(value)
          done()
        })
    })
  })
})
