'use strict'
var expect = require('chai').expect

describe('Amqp-cls', function () {
  it('publishes', function (done) {
    var ns = this.ns

    var open = require('amqplib').connect('amqp://localhost')
    var q = 'tasks'
    var key = 'amqp#publish'
    var value = Math.random()

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
