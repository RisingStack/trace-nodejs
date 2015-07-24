var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var sinon = require('sinon');

var collectorConfig = require('./config');
var Collector = require('./collector');

describe('The Trace module', function () {

  var trace;

  var transactionId = 'test';

  before(function () {
    sinon.sandbox.stub(collectorConfig, 'appName', 'test');
    sinon.sandbox.stub(collectorConfig, 'reporterType', 'logstash');
    sinon.sandbox.stub(collectorConfig, 'reporterConfig',
      '{"type":"tcp","host":"localhost","port":12201}');

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
