'use strict'
var Collector = require('./collector')

var sinon = require('sinon')
var expect = require('chai').expect

var options = null
var stub = function () { return function () {} }

var tracer = {
  userSentEvent: stub(),
  userSentError: stub(),
  systemError: stub(),
  networkError: stub(),
  serverSend: stub(),
  clientSend: stub(),
  serverRecv: stub(),
  clientRecv: stub()
}
var cache = {
  merge: stub(),
  lock: stub(),
  unlock: stub(),
  flush: stub()
}
var sampler = {
  add: stub(),
  flush: stub()
}

var events = [
  { x: 123, i: 654, t: 'sr' },
  { x: 456, i: 423, t: 'sr' },
  { x: 123, i: 423, t: 'cs' }
]

describe('Collector', function () {
  var cacheMock
  var tracerMock
  var samplerMock
  beforeEach(function () {
    cacheMock = sinon.mock(cache)
    tracerMock = sinon.mock(tracer)
    samplerMock = sinon.mock(sampler)
  })
  afterEach(function () {
    cacheMock.restore()
    tracerMock.restore()
    samplerMock.restore()
  })
  describe('during instantiation', function () {
    it('must collect severity can be changed', function () {
      var collector = new Collector({
        collectSeverity: 'DEBUG'
      }, tracer, cache)

      expect(collector.mustCollectSeverity).to.eql(7)
    })
  })
  it('caches userSentEvent', function () {
    var collector = new Collector(options, tracer, cache)
    tracerMock.expects('userSentEvent')
      .once().withExactArgs('name', {}, undefined).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      collector.defaultSeverity)

    collector.userSentEvent('name', {})

    cacheMock.verify()
  })
  it('caches userSentError', function () {
    var collector = new Collector(options, tracer, cache)
    var error = new Error()
    tracerMock.expects('userSentError')
      .once().withExactArgs('name', error, {}).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      collector.mustCollectSeverity)

    collector.userSentError('name', error, {})

    cacheMock.verify()
  })
  it('caches systemError', function () {
    var collector = new Collector(options, tracer, cache)
    var error = new Error()
    tracerMock.expects('systemError')
      .once().withExactArgs(error, {}).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      collector.mustCollectSeverity)

    collector.systemError(error, {})

    cacheMock.verify()
  })

  it('flushes cache on networkError', function () {
    var collector = new Collector(options, tracer, cache, sampler)
    var error = new Error()
    tracerMock.expects('networkError')
      .once().withExactArgs(error, {}).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      collector.mustCollectSeverity)

    cacheMock.expects('unlock').once().withExactArgs([2, 1])
    cacheMock.expects('flush').once().withExactArgs([1]).returns([events[1], events[0]])
    samplerMock.expects('add').once().withExactArgs([events[1], events[0]])

    collector.networkError(error, {})

    cacheMock.verify()
  })

  it('flushes cache on networkError, does not add to cache if empty', function () {
    var collector = new Collector(options, tracer, cache, sampler)
    var error = new Error()
    tracerMock.expects('networkError')
      .once().withExactArgs(error, {}).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      collector.mustCollectSeverity)

    cacheMock.expects('unlock').once().withExactArgs([2, 1])
    cacheMock.expects('flush').once().withExactArgs([1]).returns([])
    samplerMock.expects('add').never()

    collector.networkError(error, {})

    cacheMock.verify()
  })

  it('lock cache on clientSend', function () {
    var collector = new Collector(options, tracer, cache, sampler)
    tracerMock.expects('clientSend')
      .once().withExactArgs({ severity: 5 }, undefined).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      5)

    cacheMock.expects('lock').once().withExactArgs([2, 1])

    collector.clientSend({ severity: 5 })

    cacheMock.verify()
  })

  it('locks cache on serverRecv', function () {
    var collector = new Collector(options, tracer, cache, sampler)
    tracerMock.expects('serverRecv')
      .once().withExactArgs({ }, { severity: 2 }).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      2)

    cacheMock.expects('lock').once().withExactArgs([2, 1])

    collector.serverRecv({ }, { severity: 2 })

    cacheMock.verify()
  })

  it('flushes cache on clientRecv', function () {
    var collector = new Collector(options, tracer, cache, sampler)
    tracerMock.expects('clientRecv')
      .once().withExactArgs({}, { severity: 5 }, undefined).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      5)

    cacheMock.expects('unlock').once().withExactArgs([2, 1])
    cacheMock.expects('flush').once().withExactArgs([1]).returns([events[1], events[0]])
    samplerMock.expects('add').once().withExactArgs([events[1], events[0]])

    collector.clientRecv({}, { severity: 5 })

    cacheMock.verify()
  })

  it('flushes cache on clientRecv, does not add to sampler if empty', function () {
    var collector = new Collector(options, tracer, cache, sampler)
    tracerMock.expects('clientRecv')
      .once().withExactArgs({}, { severity: 5 }, undefined).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      5)

    cacheMock.expects('unlock').once().withExactArgs([2, 1])
    cacheMock.expects('flush').once().withExactArgs([1]).returns([])
    samplerMock.expects('add').never()

    collector.clientRecv({}, { severity: 5 })

    cacheMock.verify()
  })

  it('flushes cache on serverSend', function () {
    var collector = new Collector(options, tracer, cache, sampler)
    tracerMock.expects('serverSend')
      .once().withExactArgs({ severity: 2 }, {}).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      2)

    cacheMock.expects('unlock').once().withExactArgs([2, 1])
    cacheMock.expects('flush').once().withExactArgs([1]).returns([events[1], events[0]])
    samplerMock.expects('add').once().withExactArgs([events[1], events[0]])

    collector.serverSend({ severity: 2 }, {})

    cacheMock.verify()
  })

  it('flushes cache on serverSend, does not add to sampler if empty', function () {
    var collector = new Collector(options, tracer, cache, sampler)
    tracerMock.expects('serverSend')
      .once().withExactArgs({ severity: 2 }, {}).returns({
        briefcase: [[2, events[1]], [1, events[0]]]
      })
    cacheMock.expects('merge').once().withExactArgs(
      [2, 1],
      [events[1], events[0]],
      2)

    cacheMock.expects('unlock').once().withExactArgs([2, 1])
    cacheMock.expects('flush').once().withExactArgs([1]).returns([])
    samplerMock.expects('add').never()

    collector.serverSend({ severity: 2 }, {})

    cacheMock.verify()
  })

  it('flushes cache on end', function () {
    var collector = new Collector(options, tracer, cache, sampler)

    cacheMock.expects('unlock').once().withExactArgs([2, 1])
    cacheMock.expects('flush').once().withExactArgs([1]).returns([[events[1], events[0]]])
    samplerMock.expects('add').once().withExactArgs([events[1], events[0]])

    collector.end([[2, events[1]], [1, events[0]]])

    cacheMock.verify()
  })

  it('flushes cache on end, does not add to sampler if empty', function () {
    var collector = new Collector(options, tracer, cache, sampler)

    cacheMock.expects('unlock').once().withExactArgs([2, 1])
    cacheMock.expects('flush').once().withExactArgs([1]).returns([])
    samplerMock.expects('add').never()

    collector.end([[2, events[1]], [1, events[0]]])

    cacheMock.verify()
  })

  it('returns cache when flushed', function () {
    var collector = new Collector(options, tracer, cache, sampler)

    samplerMock.expects('flush').once().returns([[events[2], events[1], events[0]]])
    var flushed = collector.flush()
    cacheMock.verify()
    expect(flushed).to.have.members([events[2], events[1], events[0]])
  })

  it('dedupes cache when flushed', function () {
    var collector = new Collector(options, tracer, cache, sampler)

    samplerMock.expects('flush').once().returns([[events[1], events[0]], [events[1]]])
    var flushed = collector.flush()
    cacheMock.verify()
    expect(flushed).to.have.members([events[0], events[1]])
  })
})
