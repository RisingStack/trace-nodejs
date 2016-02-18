var expect = require('chai').expect
var koa = require('./koa')

describe('The koa wrapper module', function () {
  it('wraps koa onerror', function () {
    var onerrorSpy = this.sandbox.spy()

    function FakeKoa () {}
    FakeKoa.prototype.onerror = onerrorSpy

    var fakeAgent = {
      reportError: this.sandbox.spy()
    }

    koa(FakeKoa, fakeAgent)

    var error = new Error('Test error')
    new FakeKoa().onerror(error)

    expect(fakeAgent.reportError).to.be.calledWith('koa_error', error)
    expect(onerrorSpy).to.be.calledWith(error)
  })
})
