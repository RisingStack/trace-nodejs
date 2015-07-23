/* jshint expr:true */

var expect = require('chai').expect;
var proxyquire = require('proxyquire');

var Collector = require('./collector');

describe('The trace module', function () {

  var trace;

  var transactionId = 'test';

  before(function () {
    process.env.TRACE_APP_NAME = 'test';
    trace = proxyquire('./', {
      'continuation-local-storage': {
        createNamespace: function () {
          return {
            get: function () {
              return transactionId;
            }
          };
        }
      }
    });
  });

  after(function () {
    delete process.env.TRACE_APP_NAME;
  });

  it('exposes methods', function () {
    expect(trace.report).to.be.ok;
    expect(trace.getTransactionId).to.be.ok;
  });

  it('reports', function () {
    var collectorStub = this.sandbox.stub(Collector.prototype, 'report', function () {});

    var data = {
      numbers: [1, 2, 3]
    };

    trace.report(data);

    expect(collectorStub).to.be.calledWith(data);
  });

  it('returns the current transaction id', function () {

    expect(trace.getTransactionId()).to.eql(transactionId);

  });

});
