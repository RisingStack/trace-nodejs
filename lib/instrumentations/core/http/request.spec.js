var expect = require('chai').expect
var request = require('./request')
var ExternalEdgeMetrics = require('../../../agent/metrics/externalEdge')
var Collector = require('../../../agent/tracer/collector')
var microtime = require('../../../optionalDependencies/microtime')

describe('The http.request wrapper module', function () {
  var config
  var agent
  var original
  var clientSendResult
  var appliedOriginal

  beforeEach(function () {
    appliedOriginal = {
      on: this.sandbox.spy()
    }
    original = this.sandbox.stub().returns(appliedOriginal)
    config = {
      whiteListHosts: [
        'risingstack.com'
      ]
    }
    clientSendResult = {
      briefcase: {
        communication: {
          id: 'parent-id',
          transactionId: 'tr-id'
        },
        csCtx: {
          communicationId: 'child-id',
          transactionId: 'tr-id'
        }
      },
      duffelBag: {
        communicationId: 'child-id',
        transactionId: 'tr-id',
        timestamp: 42,
        parentServiceKey: 1
      }
    }
    agent = {
      getConfig: function () {
        return config
      },
      tracer: {
        collector: {
          LEVELS: Collector.prototype.LEVELS,
          mustCollectSeverity: 2,
          defaultSeverity: 3,
          clientSend: this.sandbox.stub().returns(clientSendResult),
          clientRecv: this.sandbox.stub(),
          networkError: this.sandbox.stub()
        }
      },
      externalEdgeMetrics: {
        report: this.sandbox.stub(),
        EDGE_STATUS: ExternalEdgeMetrics.prototype.EDGE_STATUS
      },
      storage: {
        get: this.sandbox.stub().returns({
          communication: {}
        }),
        bind: this.sandbox.spy()
      }
    }
  })

  it('skips whitelisted hosts', function () {
    var r = request(original, agent)

    r({
      host: 'risingstack.com'
    })

    expect(agent.tracer.collector.clientSend).not.to.be.called

    expect(original).to.be.calledWith({
      host: 'risingstack.com'
    })
  })

  describe('on non-whitelisted request', function () {
    it('calls agent.tracer.collector.clientSend with expected arguments', function () {
      var r = request(original, agent)

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(agent.tracer.collector.clientSend).to.be.calledWith({
        host: 'localhost',
        action: 'GET',
        protocol: 'http',
        resource: '/',
        severity: agent.tracer.collector.defaultSeverity
      }, { communication: {} })
    })

    it('sets headers, does not set mustCollect header', function () {
      var r = request(original, agent)

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(original).to.be.calledWith({
        headers: {
          'request-id': 'tr-id',
          'x-parent': '1',
          'x-span-id': 'child-id',
          'x-client-send': '42'
        },
        host: 'localhost',
        method: 'GET',
        path: '/'
      })
    })

    it('sets mustCollect header', function () {
      clientSendResult.duffelBag.severity = agent.tracer.collector.mustCollectSeverity
      var r = request(original, agent)

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(original).to.be.calledWith({
        headers: {
          'request-id': 'tr-id',
          'x-parent': '1',
          'x-must-collect': '1',
          'x-span-id': 'child-id',
          'x-client-send': '42'
        },
        host: 'localhost',
        method: 'GET',
        path: '/'
      })
    })
  })

  describe('on response', function () {
    it('calls agent.tracer.collector.clientRecv with ' +
    'expected arguments for instrumented peer', function () {
      var r = request(original, agent)

      appliedOriginal.on = this.sandbox.spy(function (name, cb) {
        if (name === 'response') {
          cb({
            headers: {
              'x-parent': '2',
              'x-server-send': '12345668',
              'x-server-receive': '12345698'
            },
            statusCode: 200
          })
        }
      })

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(appliedOriginal.on).to.have.been.called

      expect(agent.tracer.collector.clientRecv).to.be.calledWith({
        data: { statusCode: 200 },
        protocol: 'http',
        status: 'ok'
      }, {
        severity: 3,
        targetServiceKey: 2,
        timestamp: 12345668
      }, {
        communication: {
          id: 'parent-id',
          transactionId: 'tr-id'
        },
        csCtx: {
          communicationId: 'child-id',
          transactionId: 'tr-id'
        }
      })
    })

    it('calls agent.tracer.collector.clientRecv with ' +
      'expected duffelBag for uninstrumented peer', function () {
      var r = request(original, agent)

      appliedOriginal.on = this.sandbox.spy(function (name, cb) {
        if (name === 'response') {
          cb({
            headers: { },
            statusCode: 200
          })
        }
      })

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(appliedOriginal.on).to.have.been.called

      expect(agent.tracer.collector.clientRecv.args[0][1]).to.eql({
        severity: 3,
        targetServiceKey: undefined,
        timestamp: undefined
      })
    })

    it('sets expected payload and raises severity to mustCollect on code 400', function () {
      var r = request(original, agent)

      appliedOriginal.on = this.sandbox.spy(function (name, cb) {
        if (name === 'response') {
          cb({
            headers: { },
            statusCode: 400
          })
        }
      })

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(agent.tracer.collector.clientRecv.args[0][0]).to.eql({
        data: { statusCode: 400 },
        protocol: 'http',
        status: 'bad'
      })

      expect(agent.tracer.collector.clientRecv.args[0][1].severity).to.eql(agent.tracer.collector.mustCollectSeverity)
    })

    it('raises severity to mustCollect when header is set', function () {
      var r = request(original, agent)

      appliedOriginal.on = this.sandbox.spy(function (name, cb) {
        if (name === 'response') {
          cb({
            headers: {
              'x-parent': '2',
              'x-server-send': '12345668',
              'x-server-receive': '12345698',
              'x-must-collect': '1'
            },
            statusCode: 200
          })
        }
      })

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(agent.tracer.collector.clientRecv.args[0][0]).to.eql({
        data: { statusCode: 200 },
        protocol: 'http',
        status: 'ok'
      })

      expect(agent.tracer.collector.clientRecv.args[0][1].severity).to.eql(agent.tracer.collector.mustCollectSeverity)
    })

    it('raises severity to mustCollect when header is set', function () {
      var r = request(original, agent)

      appliedOriginal.on = this.sandbox.spy(function (name, cb) {
        if (name === 'response') {
          cb({
            headers: {
              'x-parent': '2',
              'x-server-send': '12345668',
              'x-server-receive': '12345698',
              'x-must-collect': '1'
            },
            statusCode: 200
          })
        }
      })

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(agent.tracer.collector.clientRecv.args[0][0]).to.eql({
        data: { statusCode: 200 },
        protocol: 'http',
        status: 'ok'
      })

      expect(agent.tracer.collector.clientRecv.args[0][1].severity).to.eql(agent.tracer.collector.mustCollectSeverity)
    })

    it('does not report external edge metrics when peer header for targetServiceKey exists', function () {
      var r = request(original, agent)

      appliedOriginal.on = this.sandbox.spy(function (name, cb) {
        if (name === 'response') {
          cb({
            headers: {
              'x-parent': '2'
            },
            statusCode: 200
          })
        }
      })

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(agent.externalEdgeMetrics.report).not.to.be.called
    })

    it('does not report external edge metrics when peer header for communicationId exists', function () {
      var r = request(original, agent)

      appliedOriginal.on = this.sandbox.spy(function (name, cb) {
        if (name === 'response') {
          cb({
            headers: {
              'x-span-id': 'child-id'
            },
            statusCode: 200
          })
        }
      })

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(agent.externalEdgeMetrics.report).not.to.be.called
    })

    it('calls agent.tracer.networkError with expected arguments', function () {
      var r = request(original, agent)
      var error = new Error()
      appliedOriginal.on = this.sandbox.spy(function (name, cb) {
        if (name === 'error') {
          cb(error)
        }
      })

      r({
        host: 'localhost',
        path: '/',
        headers: {},
        method: 'GET'
      })

      expect(appliedOriginal.on).to.have.been.called
      expect(agent.tracer.collector.clientSend).to.have.been.called
      expect(agent.tracer.collector.networkError)
        .to.be.calledWith(clientSendResult.briefcase, error)
    })
  })

  it('does not report external edge metrics when statusCode >= 500', function () {
    var r = request(original, agent)

    appliedOriginal.on = this.sandbox.spy(function (name, cb) {
      if (name === 'response') {
        cb({
          headers: { },
          statusCode: 500
        })
      }
    })

    r({
      host: 'localhost',
      path: '/',
      headers: {},
      method: 'GET'
    })

    expect(agent.externalEdgeMetrics.report).not.to.be.called
  })

  it('reports external edge metrics otherwise', function () {
    this.sandbox.stub(microtime, 'now').returns(42)
    var r = request(original, agent)

    appliedOriginal.on = this.sandbox.spy(function (name, cb) {
      if (name === 'response') {
        cb({
          headers: { },
          statusCode: 400
        })
      }
    })

    r({
      host: 'localhost',
      path: '/',
      headers: {},
      method: 'GET'
    })

    expect(agent.externalEdgeMetrics.report).to.be.calledWith({
      protocol: 'http',
      responseTime: 0,
      status: 1,
      targetHost: 'localhost'
    })
  })

  it('should not keep queryParams by default', function () {
    var r = request(original, agent)

    appliedOriginal.on = this.sandbox.spy(function (name, cb) {
      if (name === 'response') {
        cb({
          headers: {
            'x-parent': '2',
            'x-server-send': '12345668',
            'x-server-receive': '12345698'
          },
          statusCode: 200
        })
      }
    })

    r({
      host: 'localhost',
      path: '/query?foo=bar',
      headers: {},
      method: 'GET'
    })

    expect(agent.tracer.collector.clientSend.args[0][0].resource).to.eql('/query')
  })

  it('should keep queryParams if set in config', function () {
    this.sandbox.stub(agent, 'getConfig').returns({
      whiteListHosts: [
        'risingstack.com'
      ],
      ignoreHeaders: {
        'user-agent': ['006', '007']
      },
      keepQueryParams: true
    })

    appliedOriginal.on = this.sandbox.spy(function (name, cb) {
      if (name === 'response') {
        cb({
          headers: {
            'x-parent': '2',
            'x-server-send': '12345668',
            'x-server-receive': '12345698'
          },
          statusCode: 200
        })
      }
    })

    var r = request(original, agent)

    r({
      host: 'localhost',
      path: '/query?foo=bar',
      headers: {},
      method: 'GET'
    })

    expect(agent.tracer.collector.clientSend.args[0][0].resource).to.eql('/query?foo=bar')
  })
})
