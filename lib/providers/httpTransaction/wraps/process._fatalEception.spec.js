var expect = require('chai').expect
var continueLocalStorage = require('continuation-local-storage')
var microtime = require('microtime')

var wrapper = require('./process._fatalException')
var NAMESPACE = 'trace'

describe('The process._fatalException wrapper module', function () {
  var collector
  var original

  beforeEach(function () {
    original = this.sandbox.stub().returns('originalReturn')

    collector = {
      onCrash: this.sandbox.stub().returns({ foo: 'bar' })
    }

    this.sandbox.stub(microtime, 'now').returns(12345678)
    continueLocalStorage.createNamespace(NAMESPACE)
  })

  afterEach(function () {
    continueLocalStorage.destroyNamespace(NAMESPACE)
  })

  it('skips call #collector.onCrash and original as well', function () {
    var fatalException = wrapper(original, collector)
    var stackTrace = 'very stacktrace'
    var result

    var session = continueLocalStorage.getNamespace(NAMESPACE)
    session.run(function () {
      session.set('request-id', 'my-req-id')
      session.set('span-id', 'my-span-id')

      result = fatalException(stackTrace)
    })

    expect(original).to.be.called.once
    expect(original).to.be.calledWith(stackTrace)

    expect(collector.onCrash).to.be.called.once
    expect(collector.onCrash).to.be.calledWith({
      id: 'my-req-id',
      spanId: 'my-span-id',
      time: 12345678,
      stackTrace: stackTrace
    })

    expect(result).to.be.equal('originalReturn')
  })
})
