'use strict'

var expect = require('chai').expect
var wrapper = require('./mongodb')
var Shimmer = require('../utils/shimmer')

var COLLECTION_OPERATIONS = [
  'find',
  'findOne'
]

describe('The mongodb wrapper module', function () {
  it('should wrap collection\'s operations', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')

    var fakeMongo = {
      Collection: { }
    }

    // wrapped as a side effect
    wrapper(fakeMongo, null)

    expect(shimmerWrapStub).to.have.been.calledWith(
      fakeMongo.Collection.prototype,
      'mongodb.Collection.prototype',
      COLLECTION_OPERATIONS
    )
  })

  it('should call clientSend on the Agent when the op is called', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')
    var collectionName = 'colname'
    var operationName = 'find'
    var fakeMongo = {
      Collection: { }
    }

    var fakeAgent = {
      generateSpanId: function () { return 'fakeSpanId' },
      getMicrotime: function () { return 42 },
      getTransactionId: function () { return 'fakeTransactionId' },
      clientSend: this.sandbox.spy(),
      CLIENT_SEND: 'fakeSend'
    }

    // wrapped as a side effect
    wrapper(fakeMongo, fakeAgent)
    var wrapOp = shimmerWrapStub.args[0][3]

    var fakeMongoOp = this.sandbox.spy()
    wrapOp(fakeMongoOp, operationName).bind({
      collectionName: collectionName
    })()

    expect(fakeAgent.clientSend).to.have.been.calledOnce
    expect(fakeAgent.clientSend).to.have.been.calledWith({
      id: 'fakeTransactionId',
      spanId: 'fakeSpanId',
      host: undefined,
      time: 42,
      type: fakeAgent.CLIENT_SEND,
      url: collectionName,
      method: operationName
    })
  })

  it('should wrap the callback on the op, and call clientReceive when invoked', function () {
    var shimmerWrapStub = this.sandbox.stub(Shimmer, 'wrap')
    var collectionName = 'colname'
    var operationName = 'find'

    var fakeMongo = {
      Collection: { }
    }

    var fakeAgent = {
      generateSpanId: function () { return 'fakeSpanId' },
      getMicrotime: function () { return 42 },
      getTransactionId: function () { return 'fakeTransactionId' },
      clientSend: function () {},
      clientReceive: this.sandbox.spy(),
      CLIENT_SEND: 'fakeSend'
    }

    // wrapped as a side effect
    wrapper(fakeMongo, fakeAgent)
    var wrapOp = shimmerWrapStub.args[0][3]
    var fakeCallback = this.sandbox.spy()

    var fakeMongoOp = this.sandbox.spy()
    wrapOp(fakeMongoOp, operationName).bind({
      collectionName: collectionName
    })(fakeCallback)

    var args = fakeMongoOp.args[0]
    var wrappedCallback = args[args.length - 1]

    wrappedCallback()

    expect(fakeAgent.clientReceive).to.have.been.calledOnce
    expect(fakeAgent.clientReceive).to.have.been.calledWith({
      host: undefined,
      mustCollect: undefined,
      id: 'fakeTransactionId',
      protocol: 'mongodb',
      responseTime: 0,
      spanId: 'fakeSpanId',
      status: 0,
      url: collectionName,
      method: operationName,
      statusCode: 200
    })
  })
})
