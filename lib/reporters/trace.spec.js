var TraceReporter = require('./trace');

var expect = require('chai').expect;
var nock = require('nock');
var package = require('../../package');

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

  it('can be instantiated w/ appName and apiKey', function () {
    var traceReporter = TraceReporter.create({
      appName: 'test',
      apiKey: 'test'
    });

    expect(traceReporter).to.be.ok;
  });

  it.skip('can send data to the Collector server synchronously', function () {
    var traceReporter = TraceReporter.create({
      appName: 'test',
      apiKey: 'test'
    });

    var data = {
      trace: 'very data'
    };

    traceReporter.sendSync(data);
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
          'Authorization': 'Bearer testApiKey',
          'Content-Type': 'application/json',
          'X-Reporter-Version': package.version
        }
      })
      .post(collectorApiSampleEndpoint, JSON.stringify(data))
      .reply(201);

    var traceReporter = TraceReporter.create(options);

    traceReporter.send(data, function (err) {
      expect(err).to.be.undefined;
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
          'Authorization': 'Bearer testApiKey',
          'Content-Type': 'application/json',
          'X-Reporter-Version': package.version
        }
      })
      .post(collectorApiServiceEndpoint, JSON.stringify(data))
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

  it('retries on 409 error', function (done) {
    var options = {
      appName: 'testName',
      apiKey: 'testApiKey'
    };
    var data = {
      name: options.appName
    };
    var traceReporter = TraceReporter.create(options);
    traceReporter.retryLimit = 2;
    traceReporter.baseRetryInterval = 0;

    nock(collectorApi, {
        reqheaders: {
          'Authorization': 'Bearer testApiKey',
          'Content-Type': 'application/json',
          'X-Reporter-Version': package.version
        }
      })
      .post(collectorApiServiceEndpoint, JSON.stringify(data))
      .times(traceReporter.retryLimit)
      .reply(409, {});

    traceReporter.getService(function (err) {
      expect(err.message).to.be.eql('The trace collector-api is currently unavailable');
      done();
    });
  });
});
