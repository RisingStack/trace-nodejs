/* jshint expr:true */

var http = require('http');
var url = require('url');

var chai = require('chai');
var chaiSubset = require('chai-subset');
var nock = require('nock');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var Shimmer = require('../shimmer');
var wrapper = require('./http.request');

chai.use(chaiSubset);
chai.use(sinonChai);

var expect = chai.expect;
var dummyCollector = {
  emit: function () {},
  getService: function () {
    return 1;
  }
};
var sandbox;

describe('The wrapper module', function () {
  before(function () {
    Shimmer.wrap(http, 'http', 'request', function (original) {
      return wrapper(original, dummyCollector);
    });
  });

  after(function () {
    Shimmer.unwrap(http, 'http', 'request', function (original) {
      return wrapper(original, dummyCollector);
    });
  });

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
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
      var urlParseSpy = sandbox.spy(url, 'parse');

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
          expect(this.req.headers['x-trace']).to.be.ok;
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
      var urlParseSpy = sandbox.spy(url, 'parse');

      nock('http://non-whitelisted:8000')
        .get('/')
        .reply(function () {
          expect(this.req.headers['x-trace']).to.be.ok;
        });

      http.get('http://non-whitelisted:8000');

      expect(urlParseSpy).to.have.been.calledWith('http://non-whitelisted:8000');
    });
  });
});
