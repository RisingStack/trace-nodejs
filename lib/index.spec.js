var expect = require('chai').expect
var freshy = require('freshy')

var Agent = require('./agent')
var Instrumentation = require('./instrumentations')
var ConfigReader = require('./utils/configReader')

describe('The trace module', function () {
  beforeEach(function () {
    freshy.unload('./')
  })

  it('doesn\'t start in NODE_ENV=test', function () {
    this.sandbox.stub(process, 'env', {
      NODE_ENV: 'test'
    })

    var configReaderStub = this.sandbox.stub(ConfigReader, 'create')

    var trace = require('./')
    expect(trace.report).to.be.a('function')
    expect(trace.reportError).to.be.a('function')
    expect(trace.getTransactionId).to.be.a('function')
    expect(configReaderStub).to.have.not.been.called
  })

  it('initializes', function () {
    var fakeAgent = {
      name: 'agent'
    }

    var fakeConfig = {
      prop: 'value'
    }

    var agentCreateStub = this.sandbox.stub(Agent, 'create').returns(fakeAgent)
    var instrumentationCreateStub = this.sandbox.stub(Instrumentation, 'create').returns({})
    var configCreateStub = this.sandbox.stub(ConfigReader.prototype, 'getConfig').returns(fakeConfig)

    var trace = require('./')

    expect(trace.agent).to.eql(fakeAgent)
    expect(trace.config).to.eql(fakeConfig)
    expect(agentCreateStub).to.be.calledWith({
      config: fakeConfig
    })
    expect(instrumentationCreateStub).to.be.calledWith({
      agent: fakeAgent,
      config: fakeConfig
    })
    expect(configCreateStub).to.be.calledOnce
  })
})
