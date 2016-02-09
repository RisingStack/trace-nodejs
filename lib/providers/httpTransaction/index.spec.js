var expect = require('chai').expect

var HttpTransaction = require('./')
var wraps = require('./wraps')

describe('The HttpTransaction module', function () {
  var eventBus = {
    on: function () {},
    emit: function () {}
  }

  beforeEach(function () {
    this.sandbox.stub(wraps, 'instrument', function () {})
  })

  it('exists', function () {
    expect(HttpTransaction).to.be.ok
  })

  it('can be instantiated', function () {
    var httpTransaction = HttpTransaction.create(eventBus, {})
    expect(httpTransaction.totalRequestCount).to.be.eql(0)
    expect(httpTransaction).to.be.ok
  })

  it('reports', function () {
    var traceId = '123'
    var spanId = '456'
    var data = {
      foo: 'bar'
    }
    var name = 'name'

    var createNamespace = require('continuation-local-storage').createNamespace
    var session = createNamespace('trace')

    var httpTransaction = HttpTransaction.create(eventBus, {
      service: 1
    })

    // previous partial
    httpTransaction.partials[traceId] = {
      span: '/my-url'
    }

    httpTransaction.setService(1)

    session.run(function () {
      session.set('request-id', traceId)
      session.set('span-id', spanId)

      httpTransaction.report(name, data)
      httpTransaction.report(name, {
        bar: 'foo'
      })
    })

    // get result with next partial
    var trace = httpTransaction._initTrace('sr', {
      host: 'my-host',
      id: traceId
    })

    expect(trace).to.be.eql({
      host: 'my-host',
      service: 1,
      span: '/my-url',
      trace: '123',
      events: [
        {
          id: '456',
          time: httpTransaction.partials[traceId].events[0].time,
          type: 'us',
          data: {
            name: name,
            payload: data
          }
        }
      ]
    })
  })

  it('reports an error', function () {
    var traceId = '123'
    var spanId = '456'
    var errorName = 'name'
    var errorMsg = 'mysql_error'

    var createNamespace = require('continuation-local-storage').createNamespace
    var session = createNamespace('trace')

    var httpTransaction = HttpTransaction.create(eventBus, {
      service: 1
    })

    // previous partial
    httpTransaction.partials[traceId] = {
      span: '/my-url'
    }

    httpTransaction.setService(1)

    session.run(function () {
      session.set('request-id', traceId)
      session.set('span-id', spanId)

      httpTransaction.reportError(errorName, new Error(errorMsg))
    })

    // get result with next partial
    var trace = httpTransaction._initTrace('sr', {
      host: 'my-host',
      id: traceId
    })

    expect(trace).to.be.eql({
      isForceSampled: true,
      host: 'my-host',
      service: 1,
      span: '/my-url',
      trace: '123',
      events: [
        {
          id: '456',
          time: httpTransaction.partials[traceId].events[0].time,
          type: 'us',
          data: {
            name: errorName,
            payload: [new Error(errorMsg)]
          }
        }
      ]
    })
  })

  it('emits a send event onto the event bus', function () {
    var emitStub = this.sandbox.stub(eventBus, 'emit')

    var httpTransaction = HttpTransaction.create(eventBus, {
      initialSampleRate: 50,
      service: 1
    })

    var options = {
      isSync: false
    }

    var totalRequestCount = 10000
    var sampleSize = 60
    var sampleRate = 50
    var newSampleRate = Math.floor(totalRequestCount / sampleSize)

    var databag = {
      sampleRate: sampleRate,
      samples: [
        1
      ],
      totalRequestCount: totalRequestCount
    }

    httpTransaction.totalRequestCount = totalRequestCount
    httpTransaction.sampleSize = sampleSize
    httpTransaction.traces = [
      1
    ]

    httpTransaction._send(options)

    expect(httpTransaction.totalRequestCount).to.be.eql(0)
    expect(httpTransaction.sampleRate).to.be.eql(newSampleRate)

    expect(emitStub).to.be.calledOnce
    expect(emitStub).to.be.calledWith(eventBus.HTTP_TRANSACTION_STACK_TRACE, databag)
  })

  it('stores an errorful "ClientReceive" event with its type set to "err"', function () {
    this.sandbox.stub(eventBus, 'emit')

    var httpTransaction = HttpTransaction.create(eventBus, {
      initialSampleRate: 50,
      service: 1
    })

    var data = {
      id: 1,
      spanId: 1,
      host: 'host',
      err: 'err'
    }

    httpTransaction.onClientReceive(data)

    expect(httpTransaction.partials[1].events[0].type).to.eql('err')
  })

  describe('events', function () {
    it('stores the "ClientReceive" events w/ `x-span-id`', function () {
      var httpTransaction = HttpTransaction.create(eventBus, {})

      httpTransaction.setService(1)

      var time = 12345324953
      var id = '1235'
      var url = '/fruits/apple'
      var spanId = 'asdf'
      var headers = {
        'x-span-id': spanId
      }
      var host = 'localhost:3000'

      httpTransaction._initTrace('sr', {
        id: id,
        host: 'myserver.com',
        url: '/server-receive'
      })

      httpTransaction.onClientReceive({
        id: id,
        spanId: spanId,
        url: url,
        time: time,
        host: host,
        statusCode: 301,
        headers: headers
      })

      expect(httpTransaction.partials).to.eql({
        '1235': {
          trace: id,
          service: 1,
          span: '/server-receive',
          host: 'myserver.com',
          events: [
            {
              statusCode: 301,
              id: spanId,
              url: url,
              host: host,
              time: time,
              type: 'cr',
              data: undefined
            }
          ]
        }
      })
    })

    it('stores the "ClientSend" events w/ `x-span-id`', function () {
      var httpTransaction = HttpTransaction.create(eventBus, {})

      httpTransaction.setService(1)

      var time = 12345324953
      var id = '1235'
      var spanId = 'asdf'
      var headers = {
        'x-span-id': spanId
      }
      var method = 'GET'

      httpTransaction._initTrace('sr', {
        id: id,
        host: 'myserver.com',
        url: '/server-receive'
      })

      httpTransaction.onClientSend({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000',
        method: method,
        headers: headers
      })

      expect(httpTransaction.partials).to.eql({
        '1235': {
          trace: id,
          service: 1,
          span: '/server-receive',
          host: 'myserver.com',
          events: [
            {
              id: spanId,
              time: time,
              method: method,
              type: 'cs',
              url: '/fruits/pear',
              host: 'localhost:3000'
            }
          ]
        }
      })
    })

    it('stores the "ServerRecieve" events with no parent and timing data', function () {
      var httpTransaction = HttpTransaction.create(eventBus, {})

      httpTransaction.setService(1)

      var time = 12345324953
      var id = '1235'
      var url = '/fruits/pear'
      var spanId = 'asdf'
      var headers = {
        'x-span-id': spanId
      }
      var method = 'GET'

      httpTransaction.onServerReceive({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000',
        method: method,
        headers: headers
      })

      expect(httpTransaction.partials).to.eql({
        '1235': {
          trace: id,
          service: 1,
          span: url,
          origin: undefined,
          parent: undefined,
          method: method,
          host: 'localhost:3000',
          events: [
            {
              id: spanId,
              time: time,
              type: 'sr'
            }
          ]
        }
      })

      expect(httpTransaction.totalRequestCount).to.be.eql(1)
    })

    it('stores the "ServerRecieve" events with parent and timing data', function () {
      var httpTransaction = HttpTransaction.create(eventBus, {})

      httpTransaction.setService(1)

      var time = 12345324953
      var id = '1235'
      var url = '/fruits/pear'

      var spanId = 'asdf'
      var origin = '12312312'
      var parent = '1'
      var headers = {
        'x-span-id': spanId,
        'x-client-send': origin,
        'x-parent': parent
      }
      var method = 'GET'

      httpTransaction.onServerReceive({
        id: id,
        url: '/fruits/pear',
        time: time,
        headers: headers,
        method: method,
        host: 'localhost:3000'
      })

      expect(httpTransaction.partials).to.eql({
        '1235': {
          trace: id,
          service: 1,
          span: url,
          origin: origin,
          host: 'localhost:3000',
          method: method,
          parent: parent,
          events: [
            {
              id: spanId,
              time: time,
              type: 'sr'
            }
          ]
        }
      })
    })

    it('stores the "ServerSend" events when it is not sampled', function () {
      var httpTransaction = HttpTransaction.create(eventBus, {})

      httpTransaction.setService(1)

      httpTransaction.sampleRate = 0

      var time = 12345324953
      var id = '1235'
      var headers = {}
      var responseTime = 123

      httpTransaction.onServerSend({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000',
        headers: headers,
        responseTime: responseTime
      })

      expect(httpTransaction.partials[id]).to.be.not.ok
      expect(httpTransaction.avgResponseTime).to.be.eql(responseTime)
    })

    it('stores the "ServerSend" events when it is sampled', function (done) {
      var time = 12345324953
      var id = '1235'
      var url = '/fruits/pear'
      var service = 1
      var spanId = 'asdf'
      var headers = {
        'x-span-id': spanId
      }
      var host = 'localhost'
      var responseTime = 123

      var httpTransaction = HttpTransaction.create(eventBus, {})

      httpTransaction.setService(service)

      httpTransaction.sampleRate = 1

      httpTransaction.onServerSend({
        id: id,
        statusCode: 301,
        url: '/fruits/pear',
        time: time,
        headers: headers,
        host: host,
        responseTime: responseTime
      })

      expect(httpTransaction.avgResponseTime).to.be.eql(responseTime)
      expect(httpTransaction.traces).to.eql([{
        span: url,
        host: host,
        trace: id,
        isSampled: true,
        isForceSampled: false,
        service: service,
        statusCode: 301,
        events: [{
          id: spanId,
          type: 'ss',
          time: time
        }]
      }])

      expect(httpTransaction.rpmMetrics).to.be.eql({
        301: 1
      })

      done()
    })

    it("'ServerSend' adds to existing rpmMetrics", function (done) {
      var time = 12345324953
      var id = '1235'
      var service = 1
      var spanId = 'asdf'
      var headers = {
        'x-span-id': spanId
      }
      var host = 'localhost'

      var metricsValue = 222

      var httpTransaction = HttpTransaction.create(eventBus, {})
      var responseTime = 8

      httpTransaction.setService(service)
      httpTransaction.avgRequestCount = 2
      httpTransaction.avgResponseTime = 3.5

      httpTransaction.sampleRate = 1
      httpTransaction.rpmMetrics = {
        301: metricsValue
      }

      httpTransaction.onServerSend({
        id: id,
        statusCode: 301,
        url: '/fruits/pear',
        time: time,
        headers: headers,
        host: host,
        responseTime: responseTime
      })

      expect(httpTransaction.avgResponseTime).to.be.eql(5)
      expect(httpTransaction.rpmMetrics).to.be.eql({
        301: metricsValue + 1
      })

      done()
    })

    it('reports crash', function (done) {
      var time = 12345324953
      var stackTrace = new Error('Not found')
      stackTrace.stack = 'error happened at /usr/local/index.js at 123:10'
      var service = 1

      var httpTransaction = HttpTransaction.create(eventBus, {})
      httpTransaction.setService(service)

      httpTransaction.onCrash({
        time: time,
        stackTrace: stackTrace
      })

      var result = httpTransaction.partials[''].events[0]

      expect(httpTransaction.partials[''].service).to.be.eql(service)
      expect(result.type).to.be.eql('err')
      expect(result.data).to.be.eql({
        type: 'system-error',
        message: stackTrace.message,
        raw: {
          stack: stackTrace.stack
        }
      })

      done()
    })

    it('calculates average response time', function (done) {
      var httpTransaction = HttpTransaction.create(eventBus, {})

      expect(httpTransaction.avgResponseTime).to.be.eql(null)

      httpTransaction.calculateAvgResponseTime(2)
      expect(httpTransaction.avgResponseTime).to.be.eql(2)

      httpTransaction.calculateAvgResponseTime(5)
      expect(httpTransaction.avgResponseTime).to.be.eql(3.5)

      httpTransaction.calculateAvgResponseTime(8)
      expect(httpTransaction.avgResponseTime).to.be.eql(5)

      httpTransaction.calculateAvgResponseTime(10)
      expect(httpTransaction.avgResponseTime).to.be.eql(6.25)

      httpTransaction.calculateAvgResponseTime(10)
      expect(httpTransaction.avgResponseTime).to.be.eql(7)

      done()
    })
  })
})
