var expect = require('chai').expect
var microtime = require('microtime')

var server = require('./server')
var consts = require('../../../consts')

describe('The http.Server.prototype wrapper module', function () {
  var mustCollectStore
  var config
  var agent
  var requestId
  var parentCommId
  var original
  var serviceKey
  var appliedOriginal
  var statusCode

  beforeEach(function () {
    statusCode = 200
    appliedOriginal = this.sandbox.spy()
    original = this.sandbox.stub().returns(appliedOriginal)
    mustCollectStore = {}
    requestId = '42'
    parentCommId = '12'
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
      getRequestId: function () {
        return requestId
      },
      generateRequestId: function () {
        return requestId
      },
      generateCommId: function () {
        return parentCommId
      },
      getServiceKey: function () {
        return serviceKey
      },
      getParentCommId: function () {
        return parentCommId
      },
      setParentCommId: this.sandbox.spy(),
      serverSend: this.sandbox.spy(),
      clientSend: this.sandbox.spy(),
      clientReceive: this.sandbox.spy(),
      serverReceive: this.sandbox.spy(),
      bind: function () {
        return this.sandbox.spy()
      }.bind(this),
      clearRequest: this.sandbox.spy(),
      rpmMetrics: {
        addResponseTime: this.sandbox.spy(),
        addStatusCode: this.sandbox.spy()
      }
    }
  })

  describe('ingoreHeaders option', function () {
    it('skips requests if there is a match', function () {
      var s = server(original, agent, mustCollectStore)

      s({
        headers: {
          'user-agent': '007'
        },
        url: '/'
      })

      expect(original).to.be.calledWith({
        headers: {
          'user-agent': '007'
        },
        url: '/'
      })
    })

    it('skips the request if the path is a match', function () {
      config.ignorePaths = [
        '/healthcheck'
      ]
      var s = server(original, agent, mustCollectStore)

      s({
        url: '/healthcheck',
        headers: {}
      })

      expect(original).to.be.calledWith({
        url: '/healthcheck',
        headers: {}
      })
    })

    it('skips the request if the statusCode is a match', function () {
      config.ignoreStatusCodes = [
        401
      ]
      var s = server(original, agent, mustCollectStore)
      var writeHeadSpy = this.sandbox.spy()
      var setHeaderSpy = this.sandbox.spy()
      var cb

      var request = {
        headers: {
          host: 'localhost'
        },
        pathname: '/',
        url: '/healthcheck',
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
        statusCode: 401
      }

      this.sandbox.stub(microtime, 'now').returns(12345678)

      s(request, response)

      response.writeHead()
      cb()

      expect(agent.clearRequest).to.be.calledWith(requestId)
      expect(agent.rpmMetrics.addResponseTime).to.be.calledWith(0)
      expect(agent.rpmMetrics.addStatusCode).to.be.calledWith(401)
      expect(agent.serverSend).not.to.have.been.called
    })

    it('skips requests if there is an *', function () {
      config.ignoreHeaders = {
        'user-agent': '*'
      }
      var s = server(original, agent, mustCollectStore)

      s({
        headers: {
          'user-agent': '007'
        },
        url: '/'
      })

      expect(original).to.be.calledWith({
        headers: {
          'user-agent': '007'
        },
        url: '/'
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
        url: '/?id=1',
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
        requestId: requestId,
        method: 'POST',
        time: 12345678,
        url: '/',
        host: 'localhost',
        originTime: undefined,
        parentServiceId: undefined,
        parentCommId: undefined,
        protocol: 'http'
      })

      expect(agent.serverSend).to.be.calledWith({
        host: 'localhost',
        requestId: requestId,
        mustCollect: undefined,
        parentCommId: undefined,
        statusCode: statusCode,
        time: 12345678,
        url: '/',
        responseTime: 0,
        protocol: 'http'
      })

      expect(setHeaderSpy).to.be.calledWith('x-server-send', 12345678)
      expect(setHeaderSpy).to.be.calledWith('x-parent', 0)
      expect(agent.rpmMetrics.addResponseTime).to.be.calledWith(0)
      expect(agent.rpmMetrics.addStatusCode).to.be.calledWith(statusCode)
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
          'x-span-id': parentCommId,
          'x-must-collect': '1'
        },
        pathname: '/',
        url: '/',
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
        requestId: requestId,
        method: 'POST',
        time: 12345678,
        url: '/',
        host: 'localhost',
        originTime: undefined,
        parentServiceId: undefined,
        parentCommId: parentCommId,
        protocol: 'http'
      })

      expect(agent.serverSend).to.be.calledWith({
        host: 'localhost',
        requestId: requestId,
        parentCommId: parentCommId,
        statusCode: statusCode,
        mustCollect: consts.MUST_COLLECT.ERROR,
        time: 12345678,
        url: '/',
        responseTime: 0,
        protocol: 'http'
      })

      expect(agent.setParentCommId).to.be.calledWith(parentCommId)
      expect(setHeaderSpy).to.be.calledWith('x-server-send', 12345678)
      expect(setHeaderSpy).to.be.calledWith('x-parent', 0)
      expect(setHeaderSpy).to.be.calledWith('x-span-id', parentCommId)
      expect(setHeaderSpy).to.be.calledWith('x-must-collect', '1')
      expect(agent.rpmMetrics.addResponseTime).to.be.calledWith(0)
      expect(agent.rpmMetrics.addStatusCode).to.be.calledWith(statusCode)
      expect(writeHeadSpy).to.be.calledOnce
    })
  })
})
