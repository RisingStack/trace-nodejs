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

    it('does not throw error if appName is present', function () {
      process.env.RISINGTRACE_APP_NAME = 'test';

      require('../lib');

      process.env.RISINGTRACE_APP_NAME = undefined;
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
