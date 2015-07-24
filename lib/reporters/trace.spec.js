var TraceReporter = require('./trace');

var expect = require('chai').expect;
var nock = require('nock');
var qs = require('qs');

var config = require('../config');

var collectorApi = config.collectorApi;
var collectorApiServiceEndpoint = config.collectorApiServiceEndpoint;
var collectorApiSampleEndpoint = config.collectorApiSampleEndpoint;

describe('The Trace reporter module', function () {

  it('exists', function () {
    expect(TraceReporter).to.be.ok;
  });

  it('throws an error if apiKey is missing', function () {
    var traceReporter;
    try {
      traceReporter = TraceReporter.create({
        appName: 'test'
      });
    } catch (ex) {
      expect(ex.message).to.eql('Missing apiKey');
      return;
    }

    throw new Error('Unhandled error');
  });

  it('throws an error if appName is missing', function () {
    var traceReporter;
    try {
      traceReporter = TraceReporter.create({
        apiKey: 'test'
      });
    } catch (ex) {
      expect(ex.message).to.eql('Missing appName');
      return;
    }

    throw new Error('Unhandled error');
  });

  it('can be instantiated w/ appName and apiKey', function () {
    var traceReporter = TraceReporter.create({
      appName: 'test',
      apiKey: 'test'
    });

    expect(traceReporter).to.be.ok;
  });

  it('can send data to Collector server', function (done) {
    var options = {
      appName: 'testName',
      apiKey: 'testApiKey'
    };

    var data = {
      trace: 'very data'
    };

    nock(collectorApi, {
        reqheaders: {
          'Authorization': 'Bearer testApiKey'
        }
      })
      .post(collectorApiSampleEndpoint, qs.stringify(data))
      .reply(201);

    var traceReporter = TraceReporter.create(options);

    traceReporter.send(data, function (err) {
      expect(err).to.be.null;
      done();
    });
  });

  it('can get the service key of appName from Collector server', function (done) {
    var options = {
      appName: 'testName',
      apiKey: 'testApiKey'
    };

    var data = {
      name: options.appName
    };

    nock(collectorApi, {
        reqheaders: {
          'Authorization': 'Bearer testApiKey'
        }
      })
      .post(collectorApiServiceEndpoint, qs.stringify(data))
      .reply(201, {
        key: 1
      });

    var traceReporter = TraceReporter.create(options);

    traceReporter.getService(function (err, service) {
      expect(err).to.be.null;
      expect(service.key).to.be.eq(1);
      done();
    });
  });

});
