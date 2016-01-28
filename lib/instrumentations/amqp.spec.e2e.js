'use strict'
var cls = require('continuation-local-storage')
var ns = cls.createNamespace('app')

var expect = require('chai').expect

describe('Amqp-cls', function () {
  it('publishes', function (done) {
    require('./').instrument(ns)

    var open = require('amqplib').connect('amqp://localhost')
    var q = 'tasks'
    var key = 'amqp#publish'
    var value = 'amqp'

    ns.run(function () {
      ns.set(key, value)
      open.then(function (conn) {
        var ok = conn.createChannel()
        return ok.then(function (ch) {
          ch.assertQueue(q)
          ch.sendToQueue(q, new Buffer('something to do'))
        })
      }).then(function () {
        expect(ns.get(key)).to.eql(value)
        done()
      }, done)
    })
  })
})
