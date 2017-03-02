'use strict'
var expect = require('chai').expect
var maintainedClock = require('../util/maintainedClock')
var Tracer = require('./tracer')
var uuid = require('uuid')
var levels = require('./severity')
var Event = require('./event')
var EventEmitter = require('events')

var options = {
  serviceKey: 2,
  eventTtl: 1
}

var srPayload = {
  protocol: 'http',
  action: 'action',
  resource: 'resource',
  host: 'host',
  data: { }
}

var csPayload = {
  protocol: 'mongodb',
  action: 'action',
  resource: 'resource',
  host: 'host',
  data: { }
}

var srDuffelBag = {
  communicationId: 'communicationId',
  transactionId: 'transactionId',
  severity: levels.CRIT,
  parentServiceKey: 8,
  timestamp: 1
}

describe('Tracer', function () {
  beforeEach(function () {
    this.sandbox.stub(uuid, 'v4').callsFake(function () {
      return '42'
    })
    this.sandbox.stub(maintainedClock, 'global').callsFake(function () {
      return [42, 1454]
    })
  })

  describe('SR', function () {
    it('is prepended to empty history', function (done) {
      var tracer = Tracer.create(options)

      var result = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(result.briefcase, function () {
        expect(tracer.storage.get()).to.eql([[Event.getLocallyUniqueId({ x: 1454, i: 42 }), {
          x: 1454,
          ac: 'action',
          c: 'http',
          d: {},
          e: 'resource',
          h: 'host',
          i: 42,
          k: 8,
          o: 1,
          p: 'communicationId',
          r: 'transactionId',
          t: 'sr'
        }]])
        done()
      })
      then()
    })
    it('starts with fresh history', function (done) {
      var tracer = Tracer.create(options)

      var cs = tracer.clientSend(csPayload)

      var then = tracer.bindToHistory(cs.briefcase, function () {
        var sr = tracer.serverRecv(srPayload, srDuffelBag)

        var then2 = tracer.bindToHistory(sr.briefcase, function () {
          expect(tracer.storage.get()).to.eql([[Event.getLocallyUniqueId({ x: 1454, i: 42 }), {
            x: 1454,
            ac: 'action',
            c: 'http',
            d: {},
            e: 'resource',
            h: 'host',
            i: 42,
            k: 8,
            o: 1,
            p: 'communicationId',
            r: 'transactionId',
            t: 'sr'
          }]])
          done()
        })
        then2()
      })
      then()
    })
  })

  describe('CS', function () {
    it('is prepended to empty history', function (done) {
      var tracer = Tracer.create(options)

      var result = tracer.clientSend(csPayload)

      var then = tracer.bindToHistory(result.briefcase, function () {
        expect(tracer.storage.get()).to.eql([[Event.getLocallyUniqueId({ x: 1454, i: 42 }), {
          x: 1454,
          a: undefined,
          ac: 'action',
          c: 'mongodb',
          d: {},
          e: 'resource',
          h: 'host',
          i: 42,
          p: '42',
          r: '42',
          t: 'cs'
        }]])
        done()
      })
      then()
    })

    it('is prepended to SR', function (done) {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var cs = tracer.clientSend(csPayload)
        var then2 = tracer.bindToHistory(cs.briefcase, function () {
          expect(tracer.storage.get()).to.eql([[Event.getLocallyUniqueId({ x: 1454, i: 42 }), {
            x: 1454,
            a: 'communicationId',
            ac: 'action',
            c: 'mongodb',
            d: {},
            e: 'resource',
            h: 'host',
            i: 42,
            p: '42',
            r: 'transactionId',
            t: 'cs'
          }], [Event.getLocallyUniqueId({ x: 1454, i: 42 }), {
            x: 1454,
            ac: 'action',
            c: 'http',
            d: {},
            e: 'resource',
            h: 'host',
            i: 42,
            k: 8,
            o: 1,
            p: 'communicationId',
            r: 'transactionId',
            t: 'sr'
          }]])
          done()
        })
        then2()
      })
      then()
    })

    it('creates duffelBag', function () {
      var tracer = Tracer.create(options)

      var result = tracer.clientSend(csPayload)

      expect(result.duffelBag).to.eql({
        communicationId: '42',
        parentServiceKey: '2',
        severity: undefined,
        transactionId: '42',
        timestamp: '42'
      })
    })
  })

  describe('CR', function () {
    it('no CR with CS #1', function () {
      var tracer = Tracer.create(options)

      var result = tracer.clientRecv({}, {})

      expect(result.error).to.exist
    })

    it('no CR with CS #2', function (done) {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var cr = tracer.clientRecv({}, {})
        expect(cr.error).to.exist
        done()
      })
      then()
    })

    it('CS with CS #1', function (done) {
      var tracer = Tracer.create(options)
      var cs = tracer.clientSend(csPayload)
      var then = tracer.bindToHistory(cs.briefcase, function () {
        var cr = tracer.clientRecv({}, {})
        expect(cr.error).to.not.exist
        expect(cr.briefcase).to.have.length(2)
        done()
      })
      then()
    })

    it('CS with CS #1 (emitter version)', function (done) {
      var tracer = Tracer.create(options)

      var cs = tracer.clientSend(csPayload)

      var ee = new EventEmitter()

      var handler = function () {
        var cr = tracer.clientRecv({}, {})
        expect(cr.error).to.not.exist
        expect(cr.briefcase).to.have.length(2)
        done()
      }

      var then = tracer.bindToHistory(cs.briefcase, function () {
        tracer.bindEmitter(ee)
        ee.on('event', handler)
      })
      then()
      ee.emit('event')
    })

    it('CR with CS #2', function (done) {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var cs = tracer.clientSend(csPayload)
        var then2 = tracer.bindToHistory(cs.briefcase, function () {
          var cr = tracer.clientRecv({}, {})
          expect(cr.error).not.to.exist
          expect(cr.briefcase[0][1]).to.satisfy(function (e) { return e.t === 'cr' })
          expect(cr.briefcase).to.have.length(3)
          done()
        })
        then2()
      })
      then()
    })
  })

  describe('SS', function () {
    it('SS with SR #1', function (done) {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var ss = tracer.serverSend({})
        expect(ss.error).to.not.exist
        expect(ss.briefcase).to.have.length(2)
        done()
      })
      then()
    })

    it('SS with SR #1 (emitter version)', function (done) {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var ee = new EventEmitter()

      var handler = function () {
        var ss = tracer.serverSend({})
        expect(ss.error).to.not.exist
        expect(ss.briefcase).to.have.length(2)
        done()
      }

      var then = tracer.bindToHistory(sr.briefcase, function () {
        tracer.bindEmitter(ee)
        ee.on('event', handler)
      })
      then()
      ee.emit('event')
    })

    it('SS with SR #2', function (done) {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var cs = tracer.clientSend(csPayload)
        var then2 = tracer.bindToHistory(cs.briefcase, function () {
          var ss = tracer.serverSend({})
          expect(ss.error).not.to.exist
          expect(ss.briefcase).to.have.length(2)
          done()
        })
        then2()
      })
      then()
    })

    it('creates duffelbag', function (done) {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var cs = tracer.clientSend(csPayload)
        var then2 = tracer.bindToHistory(cs.briefcase, function () {
          var ss = tracer.serverSend({})
          expect(ss.duffelBag).to.eql({
            severity: undefined,
            targetServiceKey: '2',
            timestamp: '42'
          })
          done()
        })
        then2()
      })
      then()
    })
  })

  describe('NE', function () {
    it('no NE without CS #1', function (done) {
      var tracer = Tracer.create(options)
      var ne = tracer.networkError(new Error('Uh-oh!'))
      expect(ne.error).exist
      done()
    })

    it('no NE without CS #2', function (done) {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var ne = tracer.networkError(new Error('Uh-oh!'))
        expect(ne.error).exist
        done()
      })
      then()
    })

    it('NE with CS #1', function (done) {
      var tracer = Tracer.create(options)

      var cs = tracer.clientSend(csPayload)

      var then = tracer.bindToHistory(cs.briefcase, function () {
        var ne = tracer.networkError(new Error('Uh-oh!'))
        expect(ne.error).to.not.exist
        expect(ne.briefcase).to.have.length(2)
        expect(ne.briefcase[0][1]).to.satisfy(function (e) { return e.t === 'err' })
        done()
      })
      then()
    })

    it('NE with CS #1 (emitter version)', function (done) {
      var tracer = Tracer.create(options)

      var cs = tracer.clientSend(csPayload)

      var ee = new EventEmitter()

      var handler = function () {
        var ne = tracer.networkError(new Error('Uh-oh!'))
        expect(ne.error).to.not.exist
        expect(ne.briefcase).to.have.length(2)
        expect(ne.briefcase[0][1]).to.satisfy(function (e) { return e.t === 'err' })
        done()
      }

      var then = tracer.bindToHistory(cs.briefcase, function () {
        tracer.bindEmitter(ee)
        ee.on('event', handler)
      })
      then()
      ee.emit('event')
    })

    it('NE with CS #2', function (done) {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then2 = tracer.bindToHistory(sr.briefcase, function () {
        var cs = tracer.clientSend(csPayload)
        var then = tracer.bindToHistory(cs.briefcase, function () {
          var ne = tracer.networkError(new Error('Uh-oh!'))
          expect(ne.error).to.not.exist
          expect(ne.briefcase).to.have.length(3)
          done()
        })
        then()
      })
      then2()
    })
  })

  describe('getTransactionId', function () {
    it('returns undefined', function () {
      var tracer = Tracer.create(options)
      expect(tracer.getTransactionId()).to.not.exist
    })
    it('returns transactionId', function () {
      var tracer = Tracer.create(options)

      var sr = tracer.serverRecv(srPayload, srDuffelBag)
      var then = tracer.bindToHistory(sr.briefcase, function () {
        expect(tracer.getTransactionId()).to.eql(srDuffelBag.transactionId)
      })
      then()
    })
  })

  describe('Logs', function () {
    it('works for US', function (done) {
      var tracer = Tracer.create(options)
      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var us = tracer.userSentEvent('name', 'something')
        expect(us.briefcase).to.have.length(2)
        done()
      })
      then()
    })
    it('works for UE', function (done) {
      var tracer = Tracer.create(options)
      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var ue = tracer.userSentError('name', new Error('Uh-oh!'))
        expect(ue.briefcase).to.have.length(2)
        done()
      })
      then()
    })
    it('works for SE', function (done) {
      var tracer = Tracer.create(options)
      var sr = tracer.serverRecv(srPayload, srDuffelBag)

      var then = tracer.bindToHistory(sr.briefcase, function () {
        var se = tracer.systemError('name', new Error('Uh-oh!'))
        expect(se.briefcase).to.have.length(2)
        done()
      })
      then()
    })
  })
})
