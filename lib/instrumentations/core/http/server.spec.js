var expect = require('chai').expect
var microtime = require('../../../optionalDependencies/microtime')
var Collector = require('../../../agent/tracer/collector')
var IncomingEdgeMetrics = require('../../../agent/metrics/incomingEdge')

var server = require('./server')

describe('The http.Server.prototype wrapper module', function () {
  var config
  var agent
  var original
  var serverRecvResult
  var serverSendResult
  var appliedOriginal
  var response

  beforeEach(function () {
    appliedOriginal = this.sandbox.spy()
    original = this.sandbox.stub().returns(appliedOriginal)
    response = {
      on: this.sandbox.spy(),
      writeHead: this.sandbox.spy(),
      setHeader: this.sandbox.spy()
    }
    serverRecvResult = {
      briefcase: {
        communication: {
          id: 'comm-id',
          transactionId: 'tr-id'
        }
      }
    }
    serverSendResult = {
      briefcase: { },
      duffelBag: {
        communicationId: 'comm-id',
        targetServiceKey: 2
      }
    }
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
      tracer: {
        collector: {
          serverSend: this.sandbox.stub().returns(serverSendResult),
          serverRecv: this.sandbox.stub().returns(serverRecvResult),
          CACHE_MODES: Collector.prototype.CACHE_MODES,
          LEVELS: Collector.prototype.LEVELS,
          mustCollectSeverity: 2,
          defaultSeverity: 3
        }
      },
      incomingEdgeMetrics: {
        EDGE_STATUS: IncomingEdgeMetrics.prototype.EDGE_STATUS,
        report: this.sandbox.stub()
      },
      rpmMetrics: {
        addResponseTime: this.sandbox.stub(),
        addStatusCode: this.sandbox.stub()
      },
      storage: {
        get: this.sandbox.stub().returns({
          communication: {}
        }),
        bindNew: this.sandbox.stub().returns(function () {})
      }
    }
  })

  it('does not instrument the request if ignored by header', function () {
    var s = server(original, agent)

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

  it('does not instrument the request if ignored by path', function () {
    config.ignorePaths = [
      '/healthcheck'
    ]
    var s = server(original, agent)

    s({
      url: '/healthcheck',
      headers: {}
    })

    expect(original).to.be.calledWith({
      url: '/healthcheck',
      headers: {}
    })
  })

  it('does not instrument the request when the user agent is *', function () {
    config.ignoreHeaders = {
      'user-agent': '*'
    }
    var s = server(original, agent)

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

  it('calls agent.tracer.collector.serverRecv with expected payload', function () {
    var s = server(original, agent)

    s({
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1',
        'x-client-send': '5'
      },
      url: '/',
      method: 'GET'
    }, response)

    expect(agent.tracer.collector.serverRecv.args[0][0]).to.be.eql({
      action: 'GET',
      host: 'host',
      protocol: 'http',
      resource: '/'
    })
  })

  it('calls agent.tracer.collector.serverRecv with expected briefcase', function () {
    var s = server(original, agent)

    s({
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1',
        'x-client-send': '5'
      },
      url: '/',
      method: 'GET'
    }, response)

    expect(agent.tracer.collector.serverRecv.args[0][1]).to.be.eql({
      parentServiceKey: 1,
      severity: 3,
      timestamp: 5,
      transactionId: 'tr-id',
      communicationId: 'comm-id'
    })
  })

  it('calls agent.incomingEdgeMetrics.report', function () {
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    s({
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1',
        'x-client-send': '5'
      },
      url: '/',
      method: 'GET'
    }, response)

    expect(agent.incomingEdgeMetrics.report).to.be.calledWith({
      serviceKey: 1,
      protocol: 'http',
      transportDelay: 0
    })
  })

  it('calls agent.incomingEdgeMetrics.report without transport delay', function () {
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    s({
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }, response)

    expect(agent.incomingEdgeMetrics.report).to.be.calledWith({
      serviceKey: 1,
      protocol: 'http',
      transportDelay: undefined
    })
  })

  it('calls agent.tracer.collector.serverSend with expected payload', function () {
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    var request = {
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }
    response.statusCode = 401

    s(request, response)

    response.writeHead()

    expect(agent.tracer.collector.serverSend.args[0][0]).to.eql({
      data: { statusCode: 401 },
      protocol: 'http',
      status: 'bad'
    })
  })

  it('calls agent.tracer.collector.serverSend with expected briefcase', function () {
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    var request = {
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }
    response.statusCode = 401

    s(request, response)

    response.writeHead()

    expect(agent.tracer.collector.serverSend.args[0][1]).to.eql({
      communication: { }
    })
  })

  it('calls agent.tracer.collector.serverSend skip option is falsy', function () {
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    var request = {
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }
    response.statusCode = 401

    s(request, response)

    response.writeHead()

    expect(agent.tracer.collector.serverSend.args[0][2].skip).not.to.be.ok
  })

  it('calls agent.tracer.collector.serverSend skip option is set to true if status code is ignored', function () {
    config.ignoreStatusCodes = [
      401
    ]
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    var request = {
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }
    response.statusCode = 401

    s(request, response)

    response.writeHead()

    expect(agent.tracer.collector.serverSend.args[0][2].skip).to.be.ok
  })

  it('two response headers are set', function () {
    serverSendResult.duffelBag.timestamp = 0
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    var request = {
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }
    response.statusCode = 200

    s(request, response)

    response.writeHead()

    expect(response.setHeader).to.have.callCount(2)
    expect(response.setHeader.args[0][0]).to.eql('x-parent')
    expect(response.setHeader.args[0][1]).to.eql('2')

    expect(response.setHeader.args[1][0]).to.eql('x-server-send')
    expect(response.setHeader.args[1][1]).to.eql('0')
  })

  it('three response headers are set', function () {
    config.ignoreStatusCodes = [
      401
    ]
    serverSendResult.duffelBag.severity = agent.tracer.collector.mustCollectSeverity
    serverSendResult.duffelBag.timestamp = 0
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    var request = {
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }
    response.statusCode = 401

    s(request, response)

    response.writeHead()

    expect(response.setHeader).to.have.callCount(3)
    expect(response.setHeader.args[0][0]).to.eql('x-parent')
    expect(response.setHeader.args[0][1]).to.eql('2')

    expect(response.setHeader.args[1][0]).to.eql('x-server-send')
    expect(response.setHeader.args[1][1]).to.eql('0')

    expect(response.setHeader.args[2][0]).to.eql('x-must-collect')
    expect(response.setHeader.args[2][1]).to.eql('1')
  })

  it('new storage session is bound, context is set', function () {
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    agent.storage.bindNew = this.sandbox.spy(function (x) { return x })
    agent.storage.set = this.sandbox.spy()

    var request = {
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }

    s(request, response)

    expect(agent.storage.bindNew).to.be.called
    expect(agent.storage.set).to.be.called
  })

  it('uses implicit context', function () {
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)

    agent.storage.get = this.sandbox.stub().returns('expected')

    var request = {
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }
    s(request, response)

    response.writeHead()

    expect(agent.storage.get).to.be.calledWith('tracer.briefcase')
    expect(agent.tracer.collector.serverSend.args[0][1]).to.eql('expected')
  })

  it('falls back to SR context if implicit context is lost', function () {
    this.sandbox.stub(microtime, 'now').returns(5)
    var s = server(original, agent)
    agent.storage.get = this.sandbox.stub().returns(undefined)
    var request = {
      headers: {
        host: 'host',
        'x-span-id': 'comm-id',
        'x-request-id': 'tr-id',
        'x-parent': '1'
      },
      url: '/',
      method: 'GET'
    }
    s(request, response)

    response.writeHead()
    expect(agent.tracer.collector.serverSend.args[0][1]).to.eql(serverRecvResult.briefcase)
  })
})
