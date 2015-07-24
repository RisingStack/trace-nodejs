var path = require('path');

var expect = require('chai').expect;

var collectorConfig = require('../config');
var getConfig = require('./configReader').getConfig;

var TRACE_CONFIG_FILE = path.join(__dirname, '../../', 'example/trace.config.js');

describe('Config reader', function () {

  describe('can read data', function () {
    beforeEach(function () {
      this.sandbox.stub(collectorConfig, 'configPath', TRACE_CONFIG_FILE);
    });

    it('reads the given config file if it exists in the root', function () {
      // set the env var to undefined
      this.sandbox.stub(collectorConfig, 'configPath', undefined);

      // set the config file's path to TRACE_CONFIG_FILE
      this.sandbox.stub(path, 'join', function () {
        return TRACE_CONFIG_FILE;
      });

      var config = getConfig();
      expect(config.appName).to.be.eq('Users');
      expect(config.reporter.logstashClient).to.be.ok;
    });

    it('overrides the appName with ENV', function () {
      this.sandbox.stub(collectorConfig, 'appName', 'Other App Name');

      var config = getConfig();
      expect(config.appName).to.be.eq('Other App Name');
      expect(config.reporter.logstashClient).to.be.ok;
    });

    it('overrides the reporter with ENV', function () {
      this.sandbox.stub(collectorConfig, 'reporterType', 'trace');
      this.sandbox.stub(collectorConfig, 'reporterConfig',
        '{\"apiKey\":1,\"appName\":\"reptorterAppName\"}');

      var config = getConfig();
      expect(config.appName).to.be.eq('Users');
      expect(config.reporter.apiKey).to.be.ok;
    });

    it('overrides the reporter and the appName with ENV', function () {
      this.sandbox.stub(collectorConfig, 'appName', 'Very other appName');
      this.sandbox.stub(collectorConfig, 'reporterType', 'trace');
      this.sandbox.stub(collectorConfig, 'reporterConfig',
        '{\"apiKey\":1,\"appName\":\"reptorterAppName\"}');

      var config = getConfig();
      expect(config.appName).to.be.eq('Very other appName');
      expect(config.reporter.apiKey).to.be.ok;
    });
  });

  describe('throw error, if info is missing', function () {
    beforeEach(function () {
      this.sandbox.stub(collectorConfig, 'configPath', undefined);
    });

    it('throw error if appName is missing', function () {
      var config;

      try {
        config = getConfig();
      } catch (ex) {
        expect(ex.message).to.eql('Missing appName');
        return;
      }

      throw new Error('Unhandled error');
    });

    it('throw error if reporter is missing', function () {
      this.sandbox.stub(collectorConfig, 'appName', 'Much appName');
      var config;

      try {
        config = getConfig();
      } catch (ex) {
        expect(ex.message).to.eql('Missing reporter, we cannot send the report');
        return;
      }

      throw new Error('Unhandled error');
    });

    it('throw error if reporter config is malformed JSON', function () {
      this.sandbox.stub(collectorConfig, 'appName', 'Much appName');
      this.sandbox.stub(collectorConfig, 'reporterType', 'trace');
      this.sandbox.stub(collectorConfig, 'reporterConfig', 'Malformed JSON String');

      var config;

      try {
        config = getConfig();
      } catch (ex) {
        expect(ex.message).to.eql('Missing reporter, we cannot send the report');
        return;
      }

      throw new Error('Unhandled error');
    });
  });
});
