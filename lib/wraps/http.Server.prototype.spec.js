var expect = require('chai').expect;

var wrapper = require('./http.Server.prototype');

var dummyCollector = {
  emit: function () {
  },
  getService: function () {
    return 1;
  }
};

describe('The http.Server.prototype wrapper module', function () {

  describe('ingoreHeaders option', function () {

    it('skips requests if there is a match', function () {

      var request = {
        headers: {
          'user-agent': '007'
        }
      };

      var listener = this.sandbox.spy();

      var wrappedListener = wrapper(listener, dummyCollector, {
        ignoreHeaders: {
          'user-agent': ['006', '007']
        }
      });

      wrappedListener(request);

      expect(listener).to.be.calledWith(request);
    });

  });

});
