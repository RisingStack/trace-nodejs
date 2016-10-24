var expect = require('chai').expect
var ExpiringBuffer = require('./expiringBuffer')

describe('ExpiringBuffer', function () {
  it('should store elements', function () {
    var buffer = new ExpiringBuffer(5)
    buffer.push(5)
    buffer.push(6)
    expect(buffer.elements()).to.eql([5, 6])
  })

  it('should expire elements #3', function () {
    var buffer = new ExpiringBuffer(3)
    buffer.push(3)
    expect(buffer.elements()).to.eql([3])
    buffer.expire()
    buffer.push(2)
    expect(buffer.elements()).to.eql([3, 2])
    buffer.expire()
    buffer.push(1)
    expect(buffer.elements()).to.eql([3, 2, 1])
    buffer.expire()
    buffer.push(4)
    expect(buffer.elements()).to.eql([2, 1, 4])
  })

  it('should expire elements #1', function () {
    var buffer = new ExpiringBuffer(1)
    buffer.push(3)
    expect(buffer.elements()).to.eql([3])
    buffer.expire()
    expect(buffer.elements()).to.eql([])
  })

  it('should clear elements', function () {
    var buffer = new ExpiringBuffer(3)
    buffer.push(3)
    buffer.clear()
    expect(buffer.elements(), [])
  })

  it('should flush elements', function () {
    var buffer = new ExpiringBuffer(3)
    buffer.push(3)
    expect(buffer.flush(), [[]])
    expect(buffer.elements(), [])
  })

  it('should be empty #1', function () {
    var buffer = new ExpiringBuffer(1)
    expect(buffer.isEmpty()).to.be.true
  })

  it('should not be empty #1', function () {
    var buffer = new ExpiringBuffer(1)
    buffer.push(3)
    expect(buffer.isEmpty()).to.be.false
  })

  it('should be empty #3', function () {
    var buffer = new ExpiringBuffer(3)
    expect(buffer.isEmpty()).to.be.true
  })

  it('should not be empty #3', function () {
    var buffer = new ExpiringBuffer(3)
    buffer.push(3)
    expect(buffer.isEmpty()).to.be.false
  })
})
