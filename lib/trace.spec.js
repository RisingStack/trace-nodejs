var sinon = require('sinon')
var expect = require('chai').expect
var trace = require('./trace')
var Agent = require('./agent')
var Instrumentation = require('./instrumentations')
var ConfigReader = require('./utils/configReader')

describe('Trace', function () {
  describe('.create', function () {
    it('initializes noop Trace when NODE_ENV=test', function () {
      this.sandbox.stub(process, 'env', {
        NODE_ENV: 'test'
      })
      expect(trace.create()).to.be.equal(trace.noop)
    })

    it('initializes Trace', function () {
      this.sandbox.stub(process, 'env', {
        NODE_ENV: ''
      })
      this.sandbox.stub(ConfigReader, 'create').returns({
        getConfig: this.sandbox.stub().returns({})
      })
      var fakeTrace = { fake: 'Trace' }
      var FakeTrace = this.sandbox.stub(trace, 'Trace').returns(fakeTrace)
      var traceInstance = trace.create()
      expect(FakeTrace).to.have.been.called
      expect(traceInstance).to.be.eql(fakeTrace)
    })

    it('catches Trace constructor errors and initializes noop Trace', function () {
      this.sandbox.stub(process, 'env', {
        NODE_ENV: ''
      })
      this.sandbox.stub(ConfigReader, 'create').returns({
        getConfig: this.sandbox.stub().returns({})
      })
      var FakeTrace = this.sandbox.stub(trace, 'Trace', function () {
        var bad
        bad.property.name
      })
      this.sandbox.stub(console, 'error')
      var traceInstance = trace.create()
      expect(FakeTrace).to.have.been.called
      expect(traceInstance).to.be.eql(trace.noop)
    })
  })

  describe('.Trace', function () {
    var fakeConfig = {
      prop: 'value'
    }
    var fakeAgent = {
      name: 'agent',
      tracer: {
        collector: {
          userSentEvent: sinon.spy(),
          userSentError: sinon.spy(),
          getTransactionId: sinon.spy()
        }
      },
      storage: {
        get: sinon.spy()
      },
      start: sinon.spy(),
      customMetrics: {
        increment: sinon.spy(),
        record: sinon.spy()
      },
      memoryProfiler: { }
    }

    afterEach(function () {
      fakeAgent.start.reset()
      fakeAgent.storage.get.reset()
      fakeAgent.tracer.collector.userSentEvent.reset()
      fakeAgent.tracer.collector.userSentError.reset()
      fakeAgent.tracer.collector.getTransactionId.reset()
      fakeAgent.customMetrics.increment.reset()
      fakeAgent.customMetrics.record.reset()
    })

    it('is a constructor', function () {
      expect(trace.Trace).to.be.a('function')
    })

    it('starts agent', function () {
      var agentCreateStub = this.sandbox.stub(Agent, 'create').returns(fakeAgent)
      var instrumentationCreateStub = this.sandbox.stub(Instrumentation, 'create').returns({})
      // eslint-disable-next-line
      new trace.Trace(fakeConfig)
      expect(agentCreateStub).to.be.calledWith({
        config: fakeConfig
      })
      expect(instrumentationCreateStub).to.be.calledWith({
        agent: fakeAgent,
        config: fakeConfig
      })
      expect(fakeAgent.start).to.be.called
    })

    describe('public API implementation', function () {
      describe('report', function () {
        it('is a function', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          expect(instance.report).to.be.a('function')
        })
        it('calls Agent.tracer.collector.userSentEvent when called correctly', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          instance.report('something', 'anything')
          expect(fakeAgent.storage.get).to.have.been.called
          expect(fakeAgent.tracer.collector.userSentEvent).to.have.been.called
        })
        it('throws error on when first parameter is not a string', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          expect(function () { instance.report({ not: 'a string' }) })
            .to.throw(Error, /First parameter invalid, should be a string/)
        })
      })

      describe('reportError', function () {
        it('is a function', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          expect(instance.reportError).to.be.a('function')
        })
        it('calls Agent.tracer.collector.userSentError when called correctly', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          instance.reportError('something', new Error('xyz'))
          expect(fakeAgent.storage.get).to.have.been.called
          expect(fakeAgent.tracer.collector.userSentError).to.have.been.called
        })
        it('throws error on when first parameter is not a string', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          expect(function () { instance.reportError({ not: 'a string' }) })
            .to.throw(Error, /First parameter invalid, should be a string/)
        })
      })

      describe('getTransactionId', function () {
        it('is a function', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          expect(instance.getTransactionId).to.be.a('function')
        })
        it('calls agent.getRequestId', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          instance.getTransactionId()
          expect(fakeAgent.storage.get).to.have.been.called
          expect(fakeAgent.tracer.collector.getTransactionId).to.have.been.called
        })
      })

      describe('customMetrics', function () {
        it('is a function', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          expect(instance.incrementMetric).to.be.a('function')
          expect(instance.recordMetric).to.be.a('function')
        })
        it('calls agent.customMetrics', function () {
          this.sandbox.stub(Agent, 'create').returns(fakeAgent)
          this.sandbox.stub(Instrumentation, 'create').returns({})
          var instance = new trace.Trace(fakeConfig)
          instance.incrementMetric()
          instance.recordMetric()
          expect(fakeAgent.customMetrics.record).to.have.been.called
          expect(fakeAgent.customMetrics.increment).to.have.been.called
        })
      })
    })
  })

  it('.noop implements API', function () {
    var noop = require('./trace').noop
    expect(noop).to.be.an('object')
    expect(noop.report).to.be.a('function')
    expect(noop.reportError).to.be.a('function')
    expect(noop.getTransactionId).to.be.a('function')
    expect(noop.sendMemorySnapshot).to.be.a('function')
    expect(noop.recordMetric).to.be.a('function')
    expect(noop.incrementMetric).to.be.a('function')
  })
})
