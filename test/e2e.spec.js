var supertest = require('supertest');
var expect = require('chai').expect;

describe('The collector', function () {

  describe('reads the config', function () {

    it('throws an error if appName is missing', function () {
      var seetru;
      try {
        seetru = require('../lib');
      } catch (ex) {
        expect(ex.message).to.eql('Missing appName');
        return;
      }

      throw new Error('Unhandled error');
    });

    it('throws an error if apiKey is missing', function () {
      process.env.RISINGTRACE_APP_NAME = 'test';
      var seetru;
      try {
        seetru = require('../lib');
      } catch (ex) {
        expect(ex.message).to.eql('Missing apiKey');
        return;
      } finally {
        //reset our env variable\
        process.env.RISINGTRACE_APP_NAME = undefined;
      }

      throw new Error('Unhandled error');
    });

    it('does not throw error if apiKey and appName is present', function () {
      process.env.RISINGTRACE_APP_NAME = 'test';
      process.env.RISINGTRACE_API_KEY = 'test';

      var seetru = require('../lib');

      process.env.RISINGTRACE_APP_NAME = undefined;
      process.env.RISINGTRACE_API_KEY = undefined;
    });

  });

  describe('collects orphan traces (stacks)', function () {

    it('sends the traces to the trace collector api');

  });

  it('gets a serviceId', function () {

  });

  it('send user events (report)', function () {

  });

});
