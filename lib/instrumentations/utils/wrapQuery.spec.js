var expect = require('chai').expect
var wrapQuery = require('./wrapQuery')
var consts = require('../../consts')

function fakeAgent (sandbox) {
  return {
    generateCommId: function () { return 'fakeChildCommId' },
    getMicrotime: function () { return 42 },
    getRequestId: function () { return 'fakeRequestId' },
    clientSend: sandbox.spy(),
    clientReceive: sandbox.spy(),
    CLIENT_SEND: 'fakeSend'
  }
}

describe('wrapQuery', function () {
  it('should notify agent on send', function () {
    var query = this.sandbox.spy()
    var agent = fakeAgent(this.sandbox)
    wrapQuery(query, [], agent, {
      url: 'fakeUrl',
      host: 'fakeHost',
      parameter: 'fakeParam',
      method: 'fakeMethod'
    })
    expect(agent.clientSend).to.have.been.calledWith({
      host: 'fakeHost',
      requestId: 'fakeRequestId',
      method: 'fakeMethod',
      childCommId: 'fakeChildCommId',
      time: 42,
      type: 'fakeSend',
      url: 'fakeUrl'
    })
  })
  it('should call the original', function () {
    var query = this.sandbox.spy()
    var agent = fakeAgent(this.sandbox)
    wrapQuery(query, [], agent)
    expect(query).to.have.been.calledWith()
  })

  it('should pass the callback', function () {
    var query = function (cb) {
      expect(cb).to.be.a('function')
    }
    var cb = this.sandbox.spy()
    var agent = fakeAgent(this.sandbox)
    wrapQuery(query, [cb], agent)
  })

  it('should pass the callback if it\'s in an array', function () {
    var query = function (_, cb) {
      expect(cb[0]).to.be.a('function')
    }
    var cb = this.sandbox.spy()
    var agent = fakeAgent(this.sandbox)
    wrapQuery(query, ['otherArgument', [cb]], agent)
  })

  it('should shove a callback', function () {
    var query = function (cb) {
      expect(cb).to.be.a('function')
    }
    var agent = fakeAgent(this.sandbox)
    wrapQuery(query, [], agent)
  })

  it('should notify agent on receive', function () {
    var query = function (cb) { cb() }
    var agent = fakeAgent(this.sandbox)
    wrapQuery(query, [], agent, {
      url: 'fakeUrl',
      host: 'fakeHost',
      parameter: 'fakeParam',
      method: 'fakeMethod',
      protocol: 'fakeProtocol'
    })
    expect(agent.clientReceive).to.have.been.calledWith({
      host: 'fakeHost',
      requestId: 'fakeRequestId',
      method: 'fakeMethod',
      mustCollect: undefined,
      protocol: 'fakeProtocol',
      responseTime: 0,
      childCommId: 'fakeChildCommId',
      status: 0,
      statusCode: 200,
      time: 42,
      url: 'fakeUrl'
    })
  })

  it('should signal an error', function () {
    var query = function (cb) { cb(new Error('damn')) }
    var agent = fakeAgent(this.sandbox)
    wrapQuery(query, [], agent)
    expect(agent.clientReceive.args[0][0].mustCollect).to.eql(consts.MUST_COLLECT.ERROR)
  })

  it('should use parseError when given', function () {
    var err = new Error('damn')
    var query = function (cb) { cb(err) }
    var agent = fakeAgent(this.sandbox)
    var parseError = this.sandbox.spy()
    wrapQuery(query, [], agent, {
      parseError: parseError
    })
    expect(parseError).to.have.been.calledWith(err)
  })
})
