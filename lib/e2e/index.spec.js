var stream = require('stream');

var cls = require('continuation-local-storage');
var expect = require('chai').expect;
var sinon = require('sinon');

var collectorConfig = require('../config');
var wraps = require('../wraps');

describe('Trace', function () {

  before(function () {
    sinon.sandbox.stub(collectorConfig, 'appName', 'test');
    sinon.sandbox.stub(collectorConfig, 'reporterType', 'logstash');
    sinon.sandbox.stub(collectorConfig, 'reporterConfig',
      '{"type":"tcp","host":"localhost","port":12201}');
  });

  after(function () {
    wraps.uninstrument();
  });

  it('binds the stream core module', function () {
    var originalCreateNamespace = cls.createNamespace;
    var bindEmitterSpy;

    var sandbox = this.sandbox;

    sinon.sandbox.stub(cls, 'createNamespace', function (str) {
      var ns = originalCreateNamespace(str);
      bindEmitterSpy = sandbox.spy(ns, 'bindEmitter');
      return ns;
    });

    require('../');

    expect(bindEmitterSpy).to.have.been.calledWith(stream.prototype);
  });
});
