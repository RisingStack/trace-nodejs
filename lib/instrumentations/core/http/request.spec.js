var microtime = require('microtime')
var expect = require('chai').expect
var request = require('./request')

describe('The http.request wrapper module', function () {
  var mustCollectStore
  var config
  var agent
  var transactionId
  var spanId
  var original
  var serviceKey
  var appliedOriginal

  beforeEach(function () {
    appliedOriginal = this.sandbox.spy()
    original = this.sandbox.stub().returns(appliedOriginal)
    mustCollectStore = {}
    transactionId = '42'
    spanId = '12'
    serviceKey = 0
    config = {
      whiteListHosts: [
        'risingstack.com'
      ]
    }
    agent = {
      getConfig: function () {
        return config
      },
      getTransactionId: function () {
        return transactionId
      },
      generateId: function () {
        return transactionId
      },
      generateSpanId: function () {
        return spanId
      },
      getServiceKey: function () {
        return serviceKey
      },
      getSpandId: function () {
        return spanId
      },
      serverSend: this.sandbox.spy(),
      clientSend: this.sandbox.spy(),
      clientReceive: this.sandbox.spy(),
      serverReceive: this.sandbox.spy(),
      bind: this.sandbox.spy()
    }
  })

  describe('skips every whitelisted hosts', function () {
    it('wraps the HTTP.request(options) method', function () {
      var r = request(original, agent, mustCollectStore)

      r({
        host: 'risingstack.com'
      })

      expect(original).to.be.calledWith({
        host: 'risingstack.com'
      })
    })
  })

  describe('wraps all non-whitelisted hosts', function () {
    it('wraps the HTTP.get(urlString) method', function () {
      this.sandbox.stub(microtime, 'now').returns(12345678)
      var cb
      appliedOriginal.on = function (name, _cb) {
        if (name === 'response') {
          cb = _cb
        }
      }
      var r = request(original, agent, mustCollectStore)

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      cb({
        headers: {},
        statusCode: 200
      })

      expect(agent.clientSend).to.be.calledWith({
        host: 'localhost',
        id: transactionId,
        spanId: spanId,
        method: 'GET',
        mustCollect: undefined,
        time: 12345678,
        url: '/'
      })

      expect(agent.clientReceive).to.be.calledWith({
        host: 'localhost',
        id: transactionId,
        mustCollect: undefined,
        spanId: spanId,
        statusCode: 200,
        url: '/'
      })

      expect(original).to.be.calledWith({
        headers: {
          'request-id': transactionId,
          'x-parent': serviceKey.toString(),
          'x-span-id': spanId,
          'x-client-send': '12345678'
        },
        host: 'localhost',
        method: 'GET',
        path: '/'
      })
    })

    it('add must collect header', function () {
      this.sandbox.stub(microtime, 'now').returns(12345678)
      var r = request(original, agent, mustCollectStore)
      var cb
      appliedOriginal.on = function (name, _cb) {
        if (name === 'response') {
          cb = _cb
        }
      }
      mustCollectStore[transactionId] = true

      r({
        host: 'non-whitelisted'
      })
      cb({
        headers: {}
      })

      expect(original).to.be.calledWith({
        headers: {
          'request-id': '42',
          'x-client-send': '12345678',
          'x-must-collect': '1',
          'x-parent': '0',
          'x-span-id': '12'
        },
        host: 'non-whitelisted'
      })
    })
  })
})
