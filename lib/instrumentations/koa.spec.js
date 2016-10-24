var expect = require('chai').expect
var koa = require('./koa')

describe('The koa wrapper module', function () {
  it('wraps koa onerror', function () {
    var onerrorSpy = this.sandbox.spy()

    function FakeKoa () {}
    FakeKoa.prototype.onerror = onerrorSpy

    var fakeAgent = {
      tracer: {
        collector: {
          userSentError: this.sandbox.spy()
        }
      },
      storage: {
        get: this.sandbox.stub().returns('briefcase')
      }
    }

    koa(FakeKoa, fakeAgent)

    var error = new Error('Test error')
    new FakeKoa().onerror(error)

    expect(fakeAgent.tracer.collector.userSentError).to.be.calledWith('briefcase', 'koa_error', error)
    expect(onerrorSpy).to.be.calledWith(error)
  })
})
