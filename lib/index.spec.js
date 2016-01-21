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

  it('reports', function () {
    var userSentEvent = 'user_sent_event'
    var name = 'name'
    var data = {
      key: 'value'
    }
    trace.events = {
      emit: this.sandbox.spy(),
      USER_SENT_EVENT: userSentEvent
    }
    trace.report(name, data)
    expect(trace.events.emit).to.have.been.calledOnce
    expect(trace.events.emit).to.have.been.calledWith(userSentEvent, name, data)
  })

  it('returns the current transaction id', function () {
    expect(trace.getTransactionId()).to.eql(transactionId)
  })
})
