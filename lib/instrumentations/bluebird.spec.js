'use strict'

var cls = require('continuation-local-storage')
var ns = cls.createNamespace('app')
var expect = require('chai').expect

require('./')(ns)
var bluebird = require('bluebird')

describe('Bluebird-cls', function () {
  it('resolves', function (done) {
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
