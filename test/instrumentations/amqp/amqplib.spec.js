'use strict'

var expect = require('chai').expect
var wrapper = require('@risingstack/trace/lib/instrumentations/amqplib')
var microtime = require('@risingstack/trace/lib/optionalDependencies/microtime')

describe('amqplib module wrapper', function () {
  beforeEach(function () {
    delete require.cache[require.resolve('amqplib/lib/connection')]
    delete require.cache[require.resolve('amqplib/lib/callback_model')]
    delete require.cache[require.resolve('amqplib/lib/channel_model')]
    delete require.cache[require.resolve('amqplib/callback_api')]
    delete require.cache[require.resolve('amqplib/channel_api')]
    delete require.cache[require.resolve('amqplib')]
  })

  describe('channel api', function () {
    beforeEach(function () {
      delete require.cache[require.resolve('amqplib/lib/connection')]
      delete require.cache[require.resolve('amqplib/lib/channel_model')]
      delete require.cache[require.resolve('amqplib/channel_api')]
      delete require.cache[require.resolve('amqplib')]
    })

    it('instruments publish - consume', function (done) {
      this.sandbox.stub(microtime, 'now').returns(42)
      var fakeAgent = {
        incomingEdgeMetrics: {
          report: this.sandbox.spy()
        },
        getRequestId: this.sandbox.spy(),
        generateRequestId: this.sandbox.stub().returns('42'),
        generateCommId: this.sandbox.stub().returns('52'),
        getServiceKey: this.sandbox.stub().returns('62')
      }
      wrapper.instrumentations[5].post(require('amqplib/lib/connection'), fakeAgent)
      wrapper.instrumentations[3].post(require('amqplib/lib/channel_model'), fakeAgent)

      var open = require('amqplib').connect('amqp://localhost')

      // Publisher
      open.then(function (conn) {
        return conn.createChannel()
      }).then(function (ch) {
        ch.assertQueue('test').then(function (ok) {
          return ch.sendToQueue('test', new Buffer('something'))
        }).catch(function (err) {
          done(err)
        }).then(function () {
          ch.consume('test', function (msg) {
            try {
              ch.ack(msg)
              expect(fakeAgent.incomingEdgeMetrics.report).to.have.been.calledWith({
                protocol: 'amqp',
                serviceKey: 62,
                transportDelay: 0
              })
              expect(msg.content.toString()).to.eql('something')
              done()
            } catch (err) {
              done(err)
            }
          })
        })
      })
    })
  })

  describe('callback api', function () {
    beforeEach(function () {
      delete require.cache[require.resolve('amqplib/lib/connection')]
      delete require.cache[require.resolve('amqplib/lib/callback_model')]
      delete require.cache[require.resolve('amqplib/callback_api')]
      delete require.cache[require.resolve('amqplib')]
    })

    it('instruments publish - consume', function (done) {
      this.sandbox.stub(microtime, 'now').returns(42)
      var fakeAgent = {
        incomingEdgeMetrics: {
          report: this.sandbox.spy()
        },
        getRequestId: this.sandbox.spy(),
        generateRequestId: this.sandbox.stub().returns('42'),
        generateCommId: this.sandbox.stub().returns('52'),
        getServiceKey: this.sandbox.stub().returns('62')
      }
      wrapper.instrumentations[5].post(require('amqplib/lib/connection'), fakeAgent)
      wrapper.instrumentations[4].post(require('amqplib/lib/callback_model'), fakeAgent)

      require('amqplib/callback_api')
        .connect('amqp://localhost', function (err, conn) {
          if (err != null) done(err)
          conn.createChannel(onOpen)
          function onOpen (err, ch) {
            if (err != null) done(err)
            ch.assertQueue('test-cb')
            ch.consume('test-cb', function (msg) {
              try {
                ch.ack(msg)
                expect(fakeAgent.incomingEdgeMetrics.report).to.have.been.calledWith({
                  protocol: 'amqp',
                  serviceKey: 62,
                  transportDelay: 0
                })
                expect(msg.content.toString()).to.eql('callback')
                done()
              } catch (err) {
                done(err)
              }
            })
            ch.sendToQueue('test-cb', new Buffer('callback'))
          }
        })
    })
  })
})
