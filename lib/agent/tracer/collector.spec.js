var expect = require('chai').expect
var Collector = require('./collector')
var uuid = require('node-uuid')
var levels = require('./severity')
var defaults = require('lodash.defaults')
var microtime = require('../../optionalDependencies/microtime')
var assign = require('lodash.assign')

var options = {
  serviceKey: 2,
  eventTtl: 1
}

describe('Collector', function () {
  describe('SR', function () {
    var payload = {
      protocol: 'http',
      action: 'action',
      resource: 'resource',
      host: 'host',
      data: { }
    }
    var duffelBag = {
      communicationId: 'communicationId',
      transactionId: 'transactionId',
      severity: levels.CRIT,
      parentServiceKey: 8,
      timestamp: 1
    }
    it('should set default severity', function () {
      var incompleteDuffelBag = { }

      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      var result = tracer.serverRecv(payload, incompleteDuffelBag)
      expect(result.briefcase.severity).to.eql(tracer.defaultSeverity)
    })

    it('should fill missing communication info', function () {
      var incompleteDuffelBag = { }

      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      var result = tracer.serverRecv(payload, incompleteDuffelBag)
      expect(result.briefcase.communication).to.eql({
        id: id,
        transactionId: id
      })
    })

    it('should set communication info', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      var result = tracer.serverRecv(payload, duffelBag)
      expect(result.briefcase.communication).to.eql({
        id: duffelBag.communicationId,
        transactionId: duffelBag.transactionId
      })
    })

    it('should set severity', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      var result = tracer.serverRecv(payload, duffelBag)
      expect(result.briefcase.severity).to.eql(duffelBag.severity)
    })

    it('should not be collected', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      var _duffelBag = defaults({ severity: tracer.mustCollectSeverity + 1 }, duffelBag)

      tracer.serverRecv(payload, _duffelBag)
      expect(tracer.collect()).to.eql([])
    })
  })

  describe('SR - End', function () {
    var payload = {
      protocol: 'http',
      action: 'action',
      resource: 'resource',
      host: 'host',
      data: { }
    }
    var duffelBag = {
      communicationId: 'communicationId',
      transactionId: 'transactionId',
      severity: levels.CRIT,
      parentServiceKey: 8,
      timestamp: 1
    }
    it('should not be collected when not mustCollect even though SR arrived', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      var _duffelBag = defaults({ severity: tracer.mustCollectSeverity + 1 }, duffelBag)

      var sr = tracer.serverRecv(payload, _duffelBag)
      tracer.serverSend({}, sr.briefcase)
      expect(tracer.collect()).to.eql([])
    })

    it('should not be collected when not mustCollect even though it ended', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      var _duffelBag = defaults({ severity: tracer.mustCollectSeverity + 1 }, duffelBag)

      var sr = tracer.serverRecv(payload, _duffelBag)
      tracer.end(sr.briefcase)
      expect(tracer.collect()).to.eql([])
    })

    it('should be collected when mustCollect and ended', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })

      var _duffelBag = defaults({ severity: tracer.mustCollectSeverity }, duffelBag)

      var sr = tracer.serverRecv(payload, _duffelBag)
      tracer.end(sr.briefcase)
      expect(tracer.collect().length).to.be.at.least(1)
    })

    it('should have correct data', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })

      var _duffelBag = defaults({ severity: tracer.mustCollectSeverity }, duffelBag)

      var sr = tracer.serverRecv(payload, _duffelBag)
      tracer.end(sr.briefcase)
      expect(tracer.collect()).to.eql([{
        t: 'sr',
        r: 'transactionId',
        i: 2,
        p: 'communicationId',
        o: 1,
        c: 'http',
        k: 8,
        ac: 'action',
        e: 'resource',
        h: 'host',
        d: { }
      }])
    })

    it('is collected only once', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })

      var _duffelBag = defaults({ severity: tracer.mustCollectSeverity }, duffelBag)

      var sr = tracer.serverRecv(payload, _duffelBag)
      tracer.end(sr.briefcase)
      tracer.collect()
      expect(tracer.collect()).to.eql([])
    })
  })
  describe('SS', function () {
    it('is collected', function () {
      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })

      var tracer = new Collector(options)
      var ss = {
        payload: {
          protocol: 'http',
          status: 'ok',
          data: {
            statusCode: 200
          }
        },
        briefcase: {
          communication: {
            id: 'communicationId',
            transactionId: 'transactionId'
          },
          severity: tracer.mustCollectSeverity
        }
      }
      tracer.serverSend(ss.payload, ss.briefcase)
      expect(tracer.collect()).to.be.eql([{
        t: 'ss',
        r: 'transactionId',
        i: 2,
        p: 'communicationId',
        c: 'http',
        s: 'ok',
        d: { statusCode: 200 }
      }])
    })
    it('is not collected when not in a transaction', function () {
      var tracer = new Collector(options)
      var ss = {
        payload: {
          protocol: 'http',
          status: 'ok',
          data: {
            statusCode: 200
          }
        },
        briefcase: {
          severity: tracer.mustCollectSeverity
        }
      }
      tracer.serverSend(ss.payload, ss.briefcase)
      expect(tracer.collect()).to.be.eql([])
    })
  })
  describe('SR - SS', function () {
    it('both is collected even when only SS sets mustCollect', function () {
      var tracer = new Collector(options)
      var sr = {
        payload: { },
        duffelBag: {
          communicationId: 'commId',
          transactionId: 'trId',
          severity: tracer.mustCollectSeverity + 1
        }
      }
      var ss = {
        payload: { },
        briefcase: {
          communication: {
            id: sr.duffelBag.communicationId,
            transactionId: sr.duffelBag.transactionId
          },
          severity: tracer.mustCollectSeverity
        }
      }

      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })

      tracer.serverRecv(sr.payload, sr.duffelBag)
      tracer.serverSend(ss.payload, ss.briefcase)

      expect(tracer.collect().length).to.be.equal(2)
    })

    it('both is dropped when SS is skipped', function () {
      var tracer = new Collector(options)
      var sr = {
        payload: { },
        duffelBag: {
          communicationId: 'commId',
          transactionId: 'trId',
          severity: tracer.mustCollectSeverity
        }
      }
      var ss = {
        payload: { },
        briefcase: {
          communication: {
            id: sr.duffelBag.communicationId,
            transactionId: sr.duffelBag.transactionId
          },
          severity: tracer.mustCollectSeverity
        }
      }

      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })

      tracer.serverRecv(sr.payload, sr.duffelBag)
      expect(tracer.collect()).to.eql([])
      tracer.serverSend(ss.payload, ss.briefcase, { skip: true })
      expect(tracer.collect()).to.eql([])
      expect(tracer.collect()).to.eql([])
    })
  })
  describe('CS', function () {
    it('sets duffelBag and csCtx', function () {
      var tracer = new Collector(options)
      var payload = { }
      var briefcase = { }
      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })
      var result = tracer.clientSend(payload, briefcase)
      expect(result.briefcase.csCtx).to.eql({
        communicationId: id,
        transactionId: id
      })
      expect(result.duffelBag).to.eql({
        transactionId: id,
        timestamp: 2,
        communicationId: id,
        parentServiceKey: 2,
        severity: tracer.defaultSeverity
      })
    })
    it('is collected', function () {
      var tracer = new Collector(options)
      var payload = {
        protocol: 'http',
        action: 'action',
        resource: 'resource',
        host: 'host',
        data: { }
      }
      var briefcase = {
        communication: {
          id: 'communicationId',
          transactionId: 'transactionId'
        },
        severity: tracer.mustCollectSeverity
      }
      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })
      tracer.clientSend(payload, briefcase)
      expect(tracer.collect()).to.eql([{
        t: 'cs',
        r: 'transactionId',
        i: 2,
        p: id,
        c: 'http',
        a: 'communicationId',
        ac: 'action',
        e: 'resource',
        h: 'host',
        d: {}
      }])
    })
    it('is not collected (in itself) when not in a transaction', function () {
      var tracer = new Collector(options)
      var payload = { }
      var briefcase = {
        severity: tracer.mustCollectSeverity
      }
      tracer.clientSend(payload, briefcase)
      expect(tracer.collect().length).to.eql(0)
    })
  })

  describe('CS - CR', function () {
    it('is collected when not in a transaction', function () {
      var tracer = new Collector(options)
      var payload = { }
      var briefcase = {
        severity: tracer.mustCollectSeverity
      }
      var cs = tracer.clientSend(payload, briefcase)

      tracer.clientRecv({}, {}, cs.briefcase)
      expect(tracer.collect().length).to.eql(2)
    })
    it('two different ones do not affect each other', function () {
      var tracer = new Collector(options)
      var cs1 = tracer.clientSend({ }, { severity: tracer.mustCollectSeverity })
      tracer.clientRecv({}, {}, cs1.briefcase)

      var cs2 = tracer.clientSend({ }, { })
      tracer.clientRecv({}, {}, cs2.briefcase)

      expect(tracer.collect().length).to.eql(2)
    })
  })

  describe('CS - network error', function () {
    it('is collected when not in a transaction', function () {
      var tracer = new Collector(options)
      var payload = { }
      var briefcase = {
        severity: tracer.mustCollectSeverity
      }
      var cs = tracer.clientSend(payload, briefcase)

      tracer.networkError(cs.briefcase, new Error())
      expect(tracer.collect().length).to.eql(2)
    })
  })

  describe('CR', function () {
    it('is not collected when csCtx is missing', function () {
      var tracer = new Collector(options)
      var payload = { }
      var duffelBag = { }
      var briefcase = { }
      tracer.clientRecv(payload, duffelBag, briefcase)
      expect(tracer.collect()).to.eql([])
    })
    it('is collected', function () {
      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })
      var tracer = new Collector(options)
      var payload = {
        status: 'ok',
        protocol: 'http',
        data: {
          statusCode: 200
        }
      }
      var duffelBag = {
        timestamp: 1
      }
      var briefcase = {
        severity: tracer.mustCollectSeverity,
        communication: {
          id: 'id',
          transactionId: 'id'
        },
        csCtx: {
          communicationId: 'child-id',
          transactionId: 'id'
        }
      }

      tracer.clientRecv(payload, duffelBag, briefcase)
      expect(tracer.collect()).to.eql([{
        t: 'cr',
        r: 'id',
        i: 2,
        p: 'child-id',
        o: 1,
        k: undefined,
        c: 'http',
        a: 'id',
        s: 'ok',
        d: { statusCode: 200 }
      }])
    })
    it('is collected because duffelBag raises severity', function () {
      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })
      var tracer = new Collector(options)
      var payload = {
        status: 'ok',
        protocol: 'http',
        data: {
          statusCode: 200
        }
      }
      var duffelBag = {
        timestamp: 1,
        severity: tracer.mustCollectSeverity
      }
      var briefcase = {
        communication: {
          id: 'id',
          transactionId: 'id'
        },
        csCtx: {
          communicationId: 'child-id',
          transactionId: 'id'
        }
      }

      tracer.clientRecv(payload, duffelBag, briefcase)
      expect(tracer.collect().length).to.eql(1)
    })
  })
  describe('SR - CS', function () {
    it('SR mustCollect implies CS mustCollect', function () {
      var tracer = new Collector(options)
      var sr = {
        payload: {},
        duffelBag: {
          communicationId: 'communicationId',
          transactionId: 'transactionId',
          severity: tracer.mustCollectSeverity,
          parentServiceKey: 8,
          timestamp: 1
        }
      }
      var cs = {
        payload: {},
        briefcase: {
          communication: {
            id: sr.duffelBag.communicationId,
            transactionId: sr.duffelBag.transactionId
          }
        }
      }
      var srResult = tracer.serverRecv(sr.payload, sr.duffelBag)
      tracer.clientSend(cs.payload, cs.briefcase)
      tracer.end(srResult.briefcase)
      expect(tracer.collect().length).to.eql(2)
    })
  })
  describe('User sent error', function () {
    it('is collected', function () {
      var error = new Error('yikes!')

      var tracer = new Collector(options)

      tracer.userSentError({}, 'my error', error)

      expect(tracer.collect().length).to.eql(1)
    })

    it('stack trace omitted', function () {
      var error = new Error('yikes!')

      var tracer = new Collector(assign({ noStack: true }, options))

      tracer.userSentError({}, 'my error', error)
      expect(tracer.collect()[0].d.r.stack).to.not.exist
    })
  })

  describe('System error', function () {
    it('is collected', function () {
      var error = new Error('yikes!')

      var tracer = new Collector(options)

      tracer.systemError({}, error)

      expect(tracer.collect().length).to.eql(1)
    })

    it('stack trace omitted', function () {
      var error = new Error('yikes!')

      var tracer = new Collector(assign({ noStack: true }, options))

      tracer.systemError({}, error)
      expect(tracer.collect()[0].d.r.stack).to.not.exist
    })
  })

  describe('Network error', function () {
    it('has to be associated with CS', function () {
      var error = new Error('yikes!')

      var tracer = new Collector(options)

      expect(tracer.networkError({}, error).error).to.exist

      expect(tracer.collect().length).to.eql(0)
    })
    it('is collected', function () {
      var error = new Error('yikes!')

      var tracer = new Collector(options)

      tracer.networkError({
        csCtx: {
          communicationId: 'child-id',
          transactionId: 'tr-id'
        }
      }, error)

      expect(tracer.collect().length).to.eql(1)
    })

    it('stack trace omitted', function () {
      var error = new Error('yikes!')

      var tracer = new Collector(assign({ noStack: true }, options))

      tracer.networkError({
        csCtx: {
          communicationId: 'child-id',
          transactionId: 'tr-id'
        }
      }, error)
      expect(tracer.collect()[0].d.r.stack).to.not.exist
    })
  })

  describe('Sampling', function () {
    it('happens when there is a big amount of data', function () {
      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })
      var tracer = new Collector(assign({ samplerLimit: 10 }, options))
      function report () {
        var sr = {
          payload: { },
          duffelBag: {
            communicationId: 'commId',
            transactionId: 'trId',
            severity: tracer.mustCollectSeverity + 1
          }
        }
        var ss = {
          payload: { },
          briefcase: {
            communication: {
              id: sr.duffelBag.communicationId,
              transactionId: sr.duffelBag.transactionId
            },
            severity: tracer.mustCollectSeverity
          }
        }

        tracer.serverRecv(sr.payload, sr.duffelBag)
        tracer.serverSend(ss.payload, ss.briefcase)
      }
      for (var i = 0; i < 100; ++i) { report() }
      expect(tracer.collect().length).to.be.eql(20)
    })
  })
})
