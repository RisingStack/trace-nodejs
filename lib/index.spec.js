var expect = require('chai').expect

var Agent = require('./agent')
var Instrumentation = require('./instrumentations')
var ConfigReader = require('./utils/configReader')

describe('The trace module', function () {
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
      agent: fakeAgent
    })
    expect(configCreateStub).to.be.calledOnce
  })
})
