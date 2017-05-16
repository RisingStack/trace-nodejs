'use strict'

var http = require('http')
var HttpError = require('./httpError')
var httpRetry = require('./httpRetry')
var expect = require('chai').expect
var nock = require('nock')
var bl = require('bl')

describe('httpRetry', function (done) {
  it('retries', function (done) {
    nock('http://something.com')
      .post('/', 'data')
      .reply(500)
    nock('http://something.com')
      .post('/', 'data')
      .reply(200, 'response')

    this.sandbox.stub(global, 'setTimeout').callsFake(function (cb, int) {
      return process.nextTick(cb)
    })

    httpRetry({
      client: http,
      maxRetries: 1,
      reqOpts: {
        hostname: 'something.com',
        method: 'POST',
        path: '/'
      },
      payload: 'data'
    }, function (err, data) {
      expect(err).to.not.exist
      data.pipe(bl(function (err, data) {
        expect(err).not.to.exist
        expect(data.toString()).to.eql('response')
        done()
      }))
    })
  })
  it('returns error', function (done) {
    nock('http://something.com')
      .post('/', 'data')
      .reply(500, 'bad')

    this.sandbox.stub(global, 'setTimeout').callsFake(function (cb, int) {
      return process.nextTick(cb)
    })

    httpRetry({
      client: http,
      maxRetries: 0,
      reqOpts: {
        hostname: 'something.com',
        method: 'POST',
        path: '/'
      },
      payload: 'data'
    }, function (err, data) {
      expect(err).to.be.instanceof(HttpError)
      data.pipe(bl(function (err, data) {
        expect(err).to.not.exist
        expect(data.toString()).to.eql('bad')
        done()
      }))
    })
  })
})
