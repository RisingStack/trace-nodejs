var expect = require('chai').expect
var express = require('./trace-instrumentation-express')
var Shimmer = require('../utils/shimmer')

describe('The express wrapper module', function () {
  it('only wraps express 4', function () {
    var shimmerStub = this.sandbox.stub(Shimmer, 'wrap')

    express({})

    expect(shimmerStub).to.be.not.called
  })

  it('adds an error handler layer', function () {
    var useSpy = this.sandbox.spy(function (path, handler) {
      fakeExpress.Router.stack.push({
        handle: handler
      })
      return fakeExpress.Router
    })

    var fakeExpress = {
      Router: {
        stack: [],
        process_params: 'process_params',
        use: useSpy
      },
      application: {
        del: 'del'
      }
    }

    var fakeAgent = {
      reportError: this.sandbox.spy()
    }

    express(fakeExpress, fakeAgent)
    fakeExpress.Router.use('/', function (a, b, c) {})
    fakeExpress.Router.use('/', function (a, b, c) {})
    fakeExpress.Router.use('/', function (a, b, c, d) {})

    expect(fakeExpress.Router.stack.length).to.eql(4)
    expect(fakeExpress.Router.stack[2].handle.name).to.eql('expressErrorHandler')
  })
})
