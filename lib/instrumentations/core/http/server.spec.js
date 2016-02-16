var expect = require('chai').expect
var microtime = require('microtime')

var server = require('./server')

describe('The http.Server.prototype wrapper module', function () {
  var mustCollectStore
  var config
  var agent
  var transactionId
  var spanId
  var original
  var serviceKey
  var appliedOriginal
  var statusCode

  beforeEach(function () {
    statusCode = 200
    appliedOriginal = this.sandbox.spy()
    original = this.sandbox.stub().returns(appliedOriginal)
    mustCollectStore = {}
    transactionId = '42'
    spanId = '12'
    serviceKey = 0
    config = {
      whiteListHosts: [
        'risingstack.com'
      ],
      ignoreHeaders: {
        'user-agent': ['006', '007']
      }
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
      getSpanId: function () {
        return spanId
      },
      setSpanId: this.sandbox.spy(),
      serverSend: this.sandbox.spy(),
      clientSend: this.sandbox.spy(),
      clientReceive: this.sandbox.spy(),
      serverReceive: this.sandbox.spy(),
      bind: function () {
        return this.sandbox.spy()
      }.bind(this)
    }
  })

  describe('ingoreHeaders option', function () {
    it('skips requests if there is a match', function () {
      var s = server(original, agent, mustCollectStore)

      s({
        headers: {
          'user-agent': '007'
        }
      })

      expect(original).to.be.calledWith({
        headers: {
          'user-agent': '007'
        }
      })
    })

    it('skips requests if there is an *', function () {
      config.ignoreHeaders = {
        'user-agent': '*'
      }
      var s = server(original, agent, mustCollectStore)

      s({
        headers: {
          'user-agent': '007'
        }
      })

      expect(original).to.be.calledWith({
        headers: {
          'user-agent': '007'
        }
      })
    })

    it('serves a request coming from a third party', function () {
      var s = server(original, agent, mustCollectStore)
      var writeHeadSpy = this.sandbox.spy()
      var setHeaderSpy = this.sandbox.spy()
      var cb

      var request = {
        headers: {
          host: 'localhost'
        },
        pathname: '/',
        url: '/?id=2',
        method: 'POST'
      }
      var response = {
        writeHead: writeHeadSpy,
        // it is ugly, let's make it better later
        once: function (name, _cb) {
          if (name === 'finish') {
            cb = _cb
          }
        },
        setHeader: setHeaderSpy,
        statusCode: statusCode
      }

      this.sandbox.stub(microtime, 'now').returns(12345678)

      s(request, response)

      response.writeHead()
      cb()

      expect(agent.serverReceive).to.be.calledWith({
        id: transactionId,
        method: 'POST',
        time: 12345678,
        url: '/',
        host: 'localhost',
        originTime: undefined,
        parentId: undefined,
        spanId: undefined
      })

      expect(agent.serverSend).to.be.calledWith({
        host: 'localhost',
        id: transactionId,
        mustCollect: false,
        spanId: undefined,
        statusCode: statusCode,
        time: 12345678,
        url: '/',
        responseTime: 0
      })

      expect(setHeaderSpy).to.be.calledWith('x-client-send', 12345678)
      expect(setHeaderSpy).to.be.calledWith('x-parent', 0)
      expect(writeHeadSpy).to.be.calledOnce
    })

    it('serves a request with must-collect and span-id', function () {
      var s = server(original, agent, mustCollectStore)
      var writeHeadSpy = this.sandbox.spy()
      var setHeaderSpy = this.sandbox.spy()
      var cb

      var request = {
        headers: {
          host: 'localhost',
          'x-span-id': spanId,
          'x-must-collect': 1
        },
        pathname: '/',
        url: '/?id=2',
        method: 'POST'
      }
      var response = {
        writeHead: writeHeadSpy,
        // it is ugly, let's make it better later
        once: function (name, _cb) {
          if (name === 'finish') {
            cb = _cb
          }
        },
        setHeader: setHeaderSpy,
        statusCode: statusCode
      }

      this.sandbox.stub(microtime, 'now').returns(12345678)

      s(request, response)

      response.writeHead()
      cb()

      expect(agent.serverReceive).to.be.calledWith({
        id: transactionId,
        method: 'POST',
        time: 12345678,
        url: '/',
        host: 'localhost',
        originTime: undefined,
        parentId: undefined,
        spanId: spanId
      })

      expect(agent.serverSend).to.be.calledWith({
        host: 'localhost',
        id: transactionId,
        spanId: spanId,
        statusCode: statusCode,
        mustCollect: true,
        time: 12345678,
        url: '/',
        responseTime: 0
      })

      expect(agent.setSpanId).to.be.calledWith(spanId)
      expect(setHeaderSpy).to.be.calledWith('x-client-send', 12345678)
      expect(setHeaderSpy).to.be.calledWith('x-parent', 0)
      expect(setHeaderSpy).to.be.calledWith('x-span-id', spanId)
      expect(setHeaderSpy).to.be.calledWith('x-must-collect', 1)
      expect(writeHeadSpy).to.be.calledOnce
    })
  })
})
