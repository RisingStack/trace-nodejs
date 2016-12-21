var expect = require('chai').expect
var wrapQuery = require('./wrapQuery')
var ExternalEdgeMetrics = require('../../agent/metrics/externalEdge')
var microtime = require('../../optionalDependencies/microtime')

describe('wrapQuery', function () {
  var agent
  var clientSendResult

  beforeEach(function () {
    clientSendResult = {
      duffelBag: {
        timestamp: 5
      },
      briefcase: {
        communication: {
          id: 'parent-id',
          transactionId: 'tr-id'
        },
        csCtx: {
          communicationId: 'child-id',
          transactionId: 'tr-id'
        }
      }
    }
    agent = {
      tracer: {
        collector: {
          clientSend: this.sandbox.stub().returns(clientSendResult),
          clientRecv: this.sandbox.stub().returns({}),
          mustCollectSeverity: 9
        }
      },
      storage: {
        get: this.sandbox.stub().returns({
          communication: {}
        })
      },
      externalEdgeMetrics: {
        EDGE_STATUS: ExternalEdgeMetrics.prototype.EDGE_STATUS,
        report: this.sandbox.spy()
      }
    }
  })

  describe('callback api', function () {
    it('should call tracer.collector.clientSend on send', function (done) {
      var query = this.sandbox.spy(function (cb) {
        cb()
      })
      function cb () {
        expect(agent.tracer.collector.clientSend).to.have.been.calledWith({
          action: 'fakeMethod',
          data: undefined,
          host: 'fakeHost',
          protocol: 'protocol',
          resource: 'fakeUrl',
          severity: agent.tracer.collector.defaultSeverity
        }, {
          communication: {}
        })
        done()
      }
      wrapQuery(query, [cb], agent, {
        protocol: 'protocol',
        url: 'fakeUrl',
        host: 'fakeHost',
        method: 'fakeMethod',
        continuationMethod: 'callback'
      })
    })
    it('should call the original', function () {
      var query = this.sandbox.spy()
      wrapQuery(query, [], agent)
      expect(query).to.have.been.calledWith()
    })

    it('should pass the callback', function () {
      var query = function (cb) {
        expect(cb).to.be.a('function')
      }
      var cb = this.sandbox.spy()

      wrapQuery(query, [cb], agent, {
        continuationMethod: 'callback'
      })
    })

    it('should pass the callback if it\'s in an array', function () {
      var query = function (_, cb) {
        expect(cb[0]).to.be.a('function')
      }
      var cb = this.sandbox.spy()
      wrapQuery(query, ['otherArgument', [cb]], agent)
    })

    it('should shove a callback', function () {
      var query = function (cb) {
        expect(cb).to.be.a('function')
      }

      wrapQuery(query, [], agent, {
        continuationMethod: 'callback'
      })
    })

    it('should call tracer.collector.clientRecv on receive', function () {
      var query = function (cb) { cb() }

      wrapQuery(query, [], agent, {
        url: 'fakeUrl',
        host: 'fakeHost',
        parameter: 'fakeParam',
        method: 'fakeMethod',
        protocol: 'fakeProtocol',
        continuationMethod: 'callback'
      })
      expect(agent.tracer.collector.clientRecv).to.have.been.calledWith({
        protocol: 'fakeProtocol',
        status: 'ok'
      }, {
        severity: undefined
      }, clientSendResult.briefcase)
    })

    it('should set mustCollect severity on error', function () {
      var query = function (cb) { cb(new Error('damn')) }

      wrapQuery(query, [], agent, {
        continuationMethod: 'callback'
      })
      expect(agent.tracer.collector.clientRecv.args[0][1].severity)
        .to.eql(agent.tracer.collector.mustCollectSeverity)
    })

    it('should report external edge', function () {
      this.sandbox.stub(microtime, 'now').returns(5)
      var query = function (cb) { cb(new Error(null)) }
      wrapQuery(query, [], agent, {
        protocol: 'mongodb',
        host: 'target',
        continuationMethod: 'callback'
      })
      expect(agent.externalEdgeMetrics.report).to.be.calledWith({
        protocol: 'mongodb',
        responseTime: 0,
        status: 1,
        targetHost: 'target'
      })
    })
  })

  describe('promise api', function (done) {
    it('should notify agent on send', function () {
      var query = this.sandbox.spy(function () {
        return Promise.resolve()
      })
      agent.name = 'promise'
      wrapQuery(query, [], agent, {
        protocol: 'protocol',
        url: 'fakeUrl',
        host: 'fakeHost',
        method: 'fakeMethod',
        continuationMethod: 'promise'
      })
        .then(function () {
          expect(agent.tracer.collector.clientRecv).to.have.been.calledWith({
            action: 'fakeMethod',
            data: undefined,
            host: 'fakeHost',
            protocol: 'protocol',
            resource: 'fakeUrl'
          }, {
            communication: {},
            severity: undefined
          })
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('should call the original', function () {
      var query = this.sandbox.spy(function () {
        return Promise.resolve()
      })
      wrapQuery(query, [], agent, {
        continuationMethod: 'promise'
      })
      expect(query).to.have.been.called
    })

    it('should return a promise', function () {
      var query = this.sandbox.spy(function () {
        return Promise.resolve()
      })
      var returnValue = wrapQuery(query, [], agent, {
        continuationMethod: 'promise'
      })
      expect(returnValue).to.be.a('promise')
    })

    it('should not shove a callback', function () {
      var query = function () {
        var args = Array.prototype.slice.call(arguments)
        var callbacks = args.filter(function (arg) { return typeof arg === 'function' })
        expect(callbacks).to.have.length(0)
        return Promise.resolve()
      }
      wrapQuery(query, [], agent, {
        continuationMethod: 'promise'
      })
    })

    it('should notify agent on receive', function (done) {
      var query = function () {
        return Promise.resolve()
      }
      wrapQuery(query, [], agent, {
        url: 'fakeUrl',
        host: 'fakeHost',
        parameter: 'fakeParam',
        method: 'fakeMethod',
        protocol: 'fakeProtocol',
        continuationMethod: 'promise'
      })
        .then(function () {
          expect(agent.tracer.collector.clientRecv).to.have.been.calledWith({
            protocol: 'fakeProtocol',
            status: 'ok'
          }, {
            severity: undefined
          }, clientSendResult.briefcase)
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('should set mustCollect severity on error', function (done) {
      var query = function () {
        return Promise.reject(new Error())
      }
      wrapQuery(query, [], agent, {
        continuationMethod: 'promise'
      })
        .then(function () {
          console.log(arguments)
        })
        .catch(function () {
          expect(agent.tracer.collector.clientRecv.args[0][1].severity)
            .to.eql(agent.tracer.collector.mustCollectSeverity)
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })
  })

  describe('stream api', function () {
    // create our own readable stream
    var Readable = require('stream').Readable

    it('should notify agent on send', function () {
      var query = this.sandbox.spy(function () {
        return new Readable()
      })

      wrapQuery(query, [], agent, {
        protocol: 'protocol',
        url: 'fakeUrl',
        host: 'fakeHost',
        parameter: 'fakeParam',
        method: 'fakeMethod',
        continuationMethod: 'readStream'
      })
      expect(agent.tracer.collector.clientSend).to.have.been.calledWith({
        action: 'fakeMethod',
        data: undefined,
        host: 'fakeHost',
        protocol: 'protocol',
        resource: 'fakeUrl',
        severity: agent.tracer.collector.defaultSeverity
      }, {
        communication: {}
      })
    })

    it('should call the original', function () {
      var query = this.sandbox.spy(function () {
        return new Readable()
      })
      wrapQuery(query, [], agent, {
        continuationMethod: 'readStream'
      })
      expect(query).to.have.been.called
    })

    it('should return the original readable stream', function () {
      var readStream = new Readable()
      var query = this.sandbox.spy(function () {
        return readStream
      })
      var returnValue = wrapQuery(query, [], agent, {
        continuationMethod: 'readStream'
      })
      expect(returnValue).to.be.eql(readStream)
    })

    it('should not shove a callback', function () {
      var query = function () {
        var args = Array.prototype.slice.call(arguments)
        var callbacks = args.filter(function (arg) { return typeof arg === 'function' })
        expect(callbacks).to.have.length(0)
        return new Readable()
      }
      wrapQuery(query, [], agent, {
        continuationMethod: 'readStream'
      })
    })

    it('should notify agent on receive', function (done) {
      var query = function () {
        return new Readable()
      }
      var readStream = wrapQuery(query, [], agent, {
        url: 'fakeUrl',
        host: 'fakeHost',
        parameter: 'fakeParam',
        method: 'fakeMethod',
        protocol: 'fakeProtocol',
        continuationMethod: 'readStream'
      })

      readStream.resume()

      readStream.on('end', function () {
        expect(agent.tracer.collector.clientRecv).to.have.been.calledWith({
          protocol: 'fakeProtocol',
          status: 'ok'
        }, {
          severity: undefined
        }, clientSendResult.briefcase)
        done()
      })

      // end the read stream by pushing null to it
      readStream.push(null)
    })

    it('should let data through', function (done) {
      var testData = 'data'
      var query = function () {
        return new Readable()
      }
      var readStream = wrapQuery(query, [], agent, {
        url: 'fakeUrl',
        host: 'fakeHost',
        parameter: 'fakeParam',
        method: 'fakeMethod',
        protocol: 'fakeProtocol',
        continuationMethod: 'readStream'
      })

      readStream.on('data', function (data) {
        expect(data.toString('utf-8')).to.eql(testData)
        done()
      })

      // end the read stream by pushing null to it
      readStream.push(testData)
      readStream.push(null)
    })

    it('should set mustCollect severity on error', function () {
      var query = function () {
        return new Readable()
      }
      var readStream = wrapQuery(query, [], agent, {
        continuationMethod: 'readStream'
      })

      readStream.resume()

      readStream.on('error', function () {
        expect(agent.tracer.collector.clientRecv.args[0][1].severity)
          .to.eql(agent.tracer.collector.mustCollectSeverity)
      })

      readStream.emit('error', new Error('damn'))
    })

    it('should throw an error if no error listener is set', function () {
      var err = new Error('damn')
      var query = function () {
        return new Readable()
      }
      var parseError = this.sandbox.spy()

      var readStream = wrapQuery(query, [], agent, {
        parseError: parseError,
        continuationMethod: 'readStream'
      })

      try {
        readStream.emit('error', err)
      } catch (ex) {
        expect(ex).to.eql(err)
      }
    })
  })
})
