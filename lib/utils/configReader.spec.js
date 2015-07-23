var path = require('path');

var getConfig = require('./configReader').getConfig;
var expect = require('chai').expect;

var CONFIG_FILE = path.join(__dirname, '../../', 'example/trace.config.js');

describe('Config reader', function () {

  afterEach(function () {
    delete process.env.TRACE_APP_NAME;
    delete process.env.TRACE_REPORTER_TYPE;
    delete process.env.TRACE_REPORTER_CONFIG;
  });

  describe('can read data', function () {
    beforeEach(function () {
      this.sandbox.stub(path, 'join', function () {
        return CONFIG_FILE;
      });
    });

    it('reads the given config file if it exists', function () {
      var config = getConfig();
      expect(config.appName).to.be.eq('Users');
      expect(config.reporter.logstashClient).to.be.ok;
    });

    it('overrides the appName with ENV', function () {
      process.env.TRACE_APP_NAME = 'Other App Name';

      var config = getConfig();
      expect(config.appName).to.be.eq('Other App Name');
      expect(config.reporter.logstashClient).to.be.ok;
    });

    it('overrides the reporter with ENV', function () {
      process.env.TRACE_REPORTER_TYPE = 'trace';
      process.env.TRACE_REPORTER_CONFIG = '{\"apiKey\":1,\"appName\":\"reptorterAppName\"}';

      var config = getConfig();
      expect(config.appName).to.be.eq('Users');
      expect(config.reporter.apiKey).to.be.ok;
    });

    it('overrides the reporter and the appName with ENV', function () {
      process.env.TRACE_APP_NAME = 'Very other appName';
      process.env.TRACE_REPORTER_TYPE = 'trace';
      process.env.TRACE_REPORTER_CONFIG = '{\"apiKey\":1,\"appName\":\"reptorterAppName\"}';

      var config = getConfig();
      expect(config.appName).to.be.eq('Very other appName');
      expect(config.reporter.apiKey).to.be.ok;
    });
  });

  describe('throw error, if info is missing', function () {
    beforeEach(function () {
      this.sandbox.stub(path, 'join', function () {
        return;
      });
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
      process.env.TRACE_APP_NAME = 'Much appName';
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
      process.env.TRACE_APP_NAME = 'Much appName';
      process.env.TRACE_REPORTER_TYPE = 'trace';
      process.env.TRACE_REPORTER_CONFIG = 'Malformed JSON String';

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
