var http = require('http')
var url = require('url')
var microtime = require('microtime')

var expect = require('chai').expect
var nock = require('nock')
var uuid = require('node-uuid')
var continueLocalStorage = require('continuation-local-storage')

var Shimmer = require('./shimmer')
var wrapper = require('./http.request')
var Collector = require('../')

describe('The http.request wrapper module', function () {
  var mustCollectStore
  var config
  var dummyCollector

  beforeEach(function () {
    mustCollectStore = {}
    config = {
      whiteListHosts: []
    }

    dummyCollector = {
      emit: this.sandbox.spy(),
      getService: function () {
        return 1
      }
    }

    continueLocalStorage.createNamespace('trace')

    Shimmer.wrap(http, 'http', 'request', function (original) {
      return wrapper(original, dummyCollector, config, mustCollectStore)
    })
  })

  afterEach(function () {
    Shimmer.unwrap(http, 'http', 'request', function (original) {
      return wrapper(original, dummyCollector)
    })

    continueLocalStorage.destroyNamespace('trace')
  })

  describe('skips every whitelisted hosts', function () {
    it('wraps the HTTP.request(options) method', function () {
      nock('http://localhost:8000')
        .post('/')
        .reply(function () {
          expect(this.req.headers['request-id']).to.be.undefined
          expect(this.req.headers['x-parent']).to.be.undefined
          expect(this.req.headers['x-client-send']).to.be.undefined
          expect(this.req.headers['x-span-id']).to.be.undefined
        })

      config.whiteListHosts.push('localhost:8000')

      var session = continueLocalStorage.getNamespace('trace')
      session.run(function () {
        session.set('request-id', 'my-req-id')
        http
          .request({
            host: 'localhost',
            port: 8000,
            path: '/',
            method: 'POST'
          })
          .end()
      })
    })

    it('wraps the HTTP.get(urlString) method', function (done) {
      var urlParseSpy = this.sandbox.spy(url, 'parse')

      this.sandbox.stub(microtime, 'now').returns(12345678)
      this.sandbox.stub(uuid, 'v1').returns('aaa-bbb-ccc')

      nock('http://localhost:8000')
        .get('/')
        .reply(function () {
          expect(this.req.headers['request-id']).to.be.equal('my-req-id')
          expect(this.req.headers['x-parent']).to.be.equal('1')
          expect(this.req.headers['x-client-send']).to.be.equal('12345678')
          expect(this.req.headers['x-span-id']).to.be.equal('aaa-bbb-ccc')
        })

      var session = continueLocalStorage.getNamespace('trace')
      session.run(function () {
        session.set('request-id', 'my-req-id')
        http.get('http://localhost:8000')
      })

      process.nextTick(function () {
        expect(dummyCollector.emit).to.be.calledWith(Collector.CLIENT_SEND, {
          headers: {
            'request-id': 'my-req-id',
            'x-client-send': '12345678',
            'x-parent': '1',
            'x-span-id': 'aaa-bbb-ccc'
          },
          host: 'localhost',
          id: 'my-req-id',
          method: 'GET',
          mustCollect: false,
          time: 12345678,
          url: '/'
        })

        expect(dummyCollector.emit).to.be.calledWith(Collector.CLIENT_RECV, {
          headers: {},
          host: 'localhost:8000',
          id: 'my-req-id',
          mustCollect: false,
          spanId: 'aaa-bbb-ccc',
          statusCode: 200,
          time: 12345678,
          url: '/'
        })

        done()
      })

      expect(urlParseSpy).to.have.been.calledWith('http://localhost:8000')
    })
  })

  describe('wraps all non-whitelisted hosts', function () {
    it('wraps the HTTP.request(options) method', function () {
      this.sandbox.stub(microtime, 'now').returns(12345678)
      this.sandbox.stub(uuid, 'v1').returns('aaa-bbb-ccc')

      nock('http://non-whitelisted:8000')
        .post('/')
        .reply(function () {
          expect(this.req.headers['request-id']).to.be.equal('my-req-id')
          expect(this.req.headers['x-parent']).to.be.equal('1')
          expect(this.req.headers['x-client-send']).to.be.equal('12345678')
          expect(this.req.headers['x-span-id']).to.be.equal('aaa-bbb-ccc')
        })

      var session = continueLocalStorage.getNamespace('trace')
      session.run(function () {
        session.set('request-id', 'my-req-id')

        http
          .request({
            hostname: 'non-whitelisted',
            port: 8000,
            path: '/',
            method: 'POST'
          })
          .end()
      })
    })

    it('add must collect header', function (done) {
      nock('http://non-whitelisted:8000')
        .post('/')
        .reply(function () {
          expect(this.req.headers['x-must-collect']).to.be.equal('1')
        })

      var session = continueLocalStorage.getNamespace('trace')
      session.run(function () {
        session.set('request-id', 'my-req-id')

        mustCollectStore['my-req-id'] = true

        http
          .request({
            hostname: 'non-whitelisted',
            port: 8000,
            path: '/',
            method: 'POST'
          })
          .end()

        done()
      })
    })

    it('wraps the HTTP.get(urlString) method', function () {
      var urlParseSpy = this.sandbox.spy(url, 'parse')

      this.sandbox.stub(microtime, 'now').returns(12345678)
      this.sandbox.stub(uuid, 'v1').returns('aaa-bbb-ccc')

      nock('http://non-whitelisted:8000')
        .get('/')
        .reply(function () {
          expect(this.req.headers['request-id']).to.be.equal('my-req-id')
          expect(this.req.headers['x-parent']).to.be.equal('1')
          expect(this.req.headers['x-client-send']).to.be.equal('12345678')
          expect(this.req.headers['x-span-id']).to.be.equal('aaa-bbb-ccc')
        })

      var session = continueLocalStorage.getNamespace('trace')
      session.run(function () {
        session.set('request-id', 'my-req-id')
        http.get('http://non-whitelisted:8000')
      })
      expect(urlParseSpy).to.have.been.calledWith('http://non-whitelisted:8000')
    })
  })
})
