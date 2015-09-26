/* jshint expr:true */
var expect = require('chai').expect;
var usage = require('usage');

var ApmMetrics = require('./');

describe('The ApmMetrics module', function () {

  it('exists', function () {
    expect(ApmMetrics).to.be.ok;
  });

  it('can be created', function () {
    ApmMetrics.create();
  });

  it('sends metrics', function (done) {
    this.sandbox.stub(usage, 'lookup', function(pid, callback) {
      callback(null, {
        memory: 100065280,
        memoryInfo: {
          rss: 15966208,
          vsize: 3127906304
        },
        cpu: 10.6
      });
    });

    var event = {
      emit: function (name, data) {
        expect(name).to.eql('apm');
        expect(data).to.containSubset({
          memory: {
            used: 15966208,
            free: 3127906304
          },
          cpu: {
            utilization: 10.6
          }
        });
        done();
      },
      APM_METRICS: 'apm'
    };
    var apmMetrics = ApmMetrics.create(event);

    apmMetrics.collectInterval = 1;
    apmMetrics.getMetrics();
  });

});
