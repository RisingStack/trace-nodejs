'use strict'

require('../test-setup.spec.js')

var expect = require('chai').expect
var wrapper = require('../../../lib/instrumentations/trace-instrumentation-amqplib')
var microtime = require('../../../lib/optionalDependencies/@risingstack/microtime')
var Storage = require('../../../lib/agent/storage')

describe.only('amqplib', function () {
  var fakeAgent

  beforeEach(function () {
    fakeAgent = {
      incomingEdgeMetrics: {
        report: this.sandbox.spy()
      },
      getRequestId: this.sandbox.spy(),
      generateRequestId: this.sandbox.stub().returns('42'),
      generateCommId: this.sandbox.stub().returns('52'),
      getServiceKey: this.sandbox.stub().returns('62'),
      storage: new Storage()
    }
    this.sandbox.stub(microtime, 'now').returns(42)
  })

  describe('channel api module wrapper', function () {
    beforeEach(function () {
      wrapper.instrumentations[5].post(require('amqplib/lib/connection'), fakeAgent)
      wrapper.instrumentations[3].post(require('amqplib/lib/channel_model'), fakeAgent)
    })

    afterEach(function () {
      delete require.cache[require.resolve('amqplib/lib/connection')]
      delete require.cache[require.resolve('amqplib/lib/channel_model')]
      delete require.cache[require.resolve('amqplib/channel_api')]
      delete require.cache[require.resolve('amqplib')]
    })

    it('looks transparent', function (done) {
      var open = require('amqplib').connect(process.env.AMQP_URL)
      open.then(function (conn) {
        return conn.createChannel()
      }).then(function (ch) {
        ch.assertQueue('test').then(function (ok) {
          return ch.sendToQueue('test', new Buffer('something'))
        }).then(function () {
          return ch.consume('test', function (msg) {
            ch.ack(msg)
            expect(msg.content.toString()).to.eql('something')
          })
        }).then(function () {
          return ch.close()
        }).then(function () {
          done()
        }).catch(function (err) {
          done(err)
        })
      })
    })

    it('is instrumented for incoming edges', function (done) {
      var open = require('amqplib').connect(process.env.AMQP_URL)

      open.then(function (conn) {
        return conn.createChannel()
      }).then(function (ch) {
        ch.assertQueue('test').then(function (ok) {
          return ch.sendToQueue('test', new Buffer('something'))
        }).then(function () {
          return ch.consume('test', function (msg) {
            ch.ack(msg)
            expect(fakeAgent.incomingEdgeMetrics.report).to.have.been.calledWith({
              protocol: 'amqp',
              serviceKey: 62,
              transportDelay: 0
            })
          })
        }).then(function () {
          return ch.close()
        }).then(function () {
          done()
        }).catch(function (err) {
          done(err)
        })
      })
    })
  })

  describe('callback api module wrapper', function () {
    beforeEach(function () {
      wrapper.instrumentations[5].post(require('amqplib/lib/connection'), fakeAgent)
      wrapper.instrumentations[4].post(require('amqplib/lib/callback_model'), fakeAgent)
    })

    afterEach(function () {
      delete require.cache[require.resolve('amqplib/lib/connection')]
      delete require.cache[require.resolve('amqplib/lib/callback_model')]
      delete require.cache[require.resolve('amqplib/callback_api')]
      delete require.cache[require.resolve('amqplib')]
    })

    it('looks transparent', function (done) {
      require('amqplib/callback_api')
        .connect(process.env.AMQP_URL, function (err, conn) {
          if (err != null) {
            return done(err)
          }
          conn.createChannel(onOpen)
          function onOpen (err, ch) {
            if (err != null) {
              return done(err)
            }
            ch.consume('test-cb', function (msg) {
              try {
                ch.ack(msg)
                expect(msg.content.toString()).to.eql('callback')
                ch.close()
                done()
              } catch (err) {
                ch.close()
                done(err)
              }
            })
            ch.sendToQueue('test-cb', new Buffer('callback'))
          }
        })
    })

    it('is instrumented for incoming edges', function (done) {
      require('amqplib/callback_api')
        .connect(process.env.AMQP_URL, function (err, conn) {
          if (err != null) done(err)
          conn.createChannel(onOpen)
          function onOpen (err, ch) {
            if (err != null) done(err)
            ch.consume('test-cb', function (msg) {
              try {
                ch.ack(msg)
                expect(fakeAgent.incomingEdgeMetrics.report).to.have.been.calledWith({
                  protocol: 'amqp',
                  serviceKey: 62,
                  transportDelay: 0
                })
                ch.close()
                done()
              } catch (err) {
                ch.close()
                done(err)
              }
            })
            ch.sendToQueue('test-cb', new Buffer(''))
          }
        })
    })
  })
})
