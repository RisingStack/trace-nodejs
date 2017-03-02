'use strict'
var expect = require('chai').expect
var shimmer = require('./shimmer')

describe('shimmer', function () {
  var original = function () { return 'original' }
  var wrapped = function () { return 'wrapped' }
  var second = function () { return 'second' }

  it('wraps x.y', function () {
    var x = { y: original }
    var wrappedX = shimmer.wrap(x, 'y', function (_original, method) {
      expect(_original).to.eql(original)
      expect(method).to.eql('y')
      return wrapped
    })
    expect(wrappedX.y).to.eql(wrapped)
  })

  it('unwraps x.y', function () {
    var x = { y: original }
    var unwrappedX = shimmer.unwrap(shimmer.wrap(x, 'y', function () { return wrapped }), 'y')
    expect(unwrappedX.y).to.eql(original)
  })

  it('wraps x.[y, z]', function () {
    var x = { y: original, z: original }
    var wrappedX = shimmer.wrap(x, ['y', 'z'], function (_original, method) {
      expect(_original).to.eql(original)
      return wrapped
    })
    expect(wrappedX.y).to.eql(wrapped)
    expect(wrappedX.z).to.eql(wrapped)
  })

  it('unwraps x.[y, z]', function () {
    var x = { y: original, z: second }
    var unwrappedX = shimmer.unwrap(shimmer.wrap(x, ['y', 'z'], function () { return wrapped }), ['y', 'z'])
    expect(unwrappedX.y).to.eql(original)
    expect(unwrappedX.z).to.eql(second)
  })

  it('wrap tolerates missing function', function () {
    var x = { }
    var wrappedX = shimmer.wrap(x, ['y', 'z'])
    expect(wrappedX).to.eql(x)
  })

  it('unwrap tolerates missing function', function () {
    var x = { }
    var unwrappedX = shimmer.unwrap(x, ['y', 'z'])
    expect(unwrappedX).to.eql(x)
  })
})
