var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('The Trace module', function () {
  var trace
  var transactionId = 'test'

  beforeEach(function () {
    trace = proxyquire('./', {
      'continuation-local-storage': {
        createNamespace: function () {
          return {
            get: function () {
              return transactionId
            }
          }
        }
      }
    })
  })

  it('exposes methods', function () {
    expect(trace.report).to.be.ok
    expect(trace.getTransactionId).to.be.ok
  })

  it('reports')

  it('returns the current transaction id', function () {
    expect(trace.getTransactionId()).to.eql(transactionId)
  })
})
