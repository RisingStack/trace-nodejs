var http = require('http');
var url = require('url');

var expect = require('chai').expect;
var nock = require('nock');

var Shimmer = require('./shimmer');
var wrapper = require('./http.request');

var dummyCollector = {
  emit: function () {},
  getService: function () {
    return 1;
  }
};

describe('The http.request wrapper module', function () {
  before(function () {
    require('continuation-local-storage').createNamespace('trace');

    Shimmer.wrap(http, 'http', 'request', function (original) {
      return wrapper(original, dummyCollector, {
        whiteListHosts: []
      });
    });
  });

  after(function () {
    Shimmer.unwrap(http, 'http', 'request', function (original) {
      return wrapper(original, dummyCollector);
    });
  });

  describe('skips every whitelisted hosts', function () {
    it('wraps the HTTP.request(options) method', function () {
      nock('http://localhost:8000')
        .post('/')
        .reply(function () {
          expect(this.req.headers['x-trace']).to.be.not.ok;
        });

      http
        .request({
          host: 'localhost',
          port: 8000,
          path: '/',
          method: 'POST'
        })
        .end();
    });

    it('wraps the HTTP.get(urlString) method', function () {
      var urlParseSpy = this.sandbox.spy(url, 'parse');

      nock('http://localhost:8000')
        .get('/')
        .reply(function () {
          expect(this.req.headers['x-trace']).to.be.not.ok;
        });

      http.get('http://localhost:8000');

      expect(urlParseSpy).to.have.been.calledWith('http://localhost:8000');
    });
  });

  describe('wraps all non-whitelisted hosts', function () {
    it('wraps the HTTP.request(options) method', function () {
      nock('http://non-whitelisted:8000')
        .post('/')
        .reply(function () {
          expect(this.req.headers['x-parent']).to.be.ok;
          expect(this.req.headers['x-client-send']).to.be.ok;
          expect(this.req.headers['x-span-id']).to.be.ok;
        });

      http
        .request({
          hostname: 'non-whitelisted',
          port: 8000,
          path: '/',
          method: 'POST'
        })
        .end();
    });

    it('wraps the HTTP.get(urlString) method', function () {
      var urlParseSpy = this.sandbox.spy(url, 'parse');

      nock('http://non-whitelisted:8000')
        .get('/')
        .reply(function () {
          expect(this.req.headers['x-parent']).to.be.ok;
          expect(this.req.headers['x-client-send']).to.be.ok;
          expect(this.req.headers['x-span-id']).to.be.ok;
        });

      http.get('http://non-whitelisted:8000');

      expect(urlParseSpy).to.have.been.calledWith('http://non-whitelisted:8000');
    });
  });
});
