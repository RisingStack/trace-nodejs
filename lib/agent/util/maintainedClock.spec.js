'use strict'
var expect = require('chai').expect
var MaintainedClock = require('./maintainedClock')

describe('Maintained clock', function () {
  var time
  beforeEach(function () {
    time = 42
    this.sandbox.stub(require('../../optionalDependencies/@risingstack/microtime'), 'now').callsFake(function () {
      return time
    })
  })

  it('returns time and clock sequence', function () {
    var clock = MaintainedClock.create(0)
    expect(clock()).to.eql([42, 0])
  })

  it('does not increase sequence if time passes', function () {
    var clock = MaintainedClock.create(0)
    clock()
    time = 43
    expect(clock()).to.eql([43, 0])
  })

  it('increases clock sequence when time is the same', function () {
    var clock = MaintainedClock.create(0)
    clock()
    expect(clock()).to.eql([42, 1])
  })

  it('increases clock sequence when time is set back', function () {
    var clock = MaintainedClock.create(0)
    clock()
    time = 41
    expect(clock()).to.eql([41, 1])
  })

  it('maintains mod 2^16 clock sequence', function () {
    var clock = MaintainedClock.create(65535)
    clock()
    time = 41
    expect(clock()).to.eql([41, 0])
  })
  describe('global', function () {
    it('is a timer', function () {
      var clock = MaintainedClock.global
      var time = clock()
      expect(time[0]).to.eql(42)
      expect(time[1]).to.be.a('number')
    })
  })
})
