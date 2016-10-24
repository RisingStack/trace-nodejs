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

    it('is not collected when not mustCollect', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      var _duffelBag = defaults({ severity: tracer.mustCollectSeverity + 1 }, duffelBag)

      tracer.serverRecv(payload, _duffelBag)
      expect(tracer.collect()).to.eql([])
    })

    it('is collected when mustCollect', function () {
      var tracer = new Collector(options)

      var id = 'uuid'

      this.sandbox.stub(uuid, 'v4', function () {
        return id
      })

      this.sandbox.stub(microtime, 'now', function () {
        return 2
      })

      var _duffelBag = defaults({ severity: tracer.mustCollectSeverity }, duffelBag)

      tracer.serverRecv(payload, _duffelBag)
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

      tracer.serverRecv(payload, _duffelBag)
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
    it('SR is not collected when only SS sets mustCollect because it has expired', function () {
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
      expect(tracer.collect()).be.eql([])
      tracer.serverSend(ss.payload, ss.briefcase)
      var result = tracer.collect()
      expect(result.length).to.be.equal(1)
      expect(result[0].t).to.be.eql('ss')
    })
    it('both is collected when only SS sets mustCollect because SR has not expired yet', function () {
      var _options = defaults({ eventTtl: 2 }, options)
      var tracer = new Collector(_options)
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
      expect(tracer.collect()).be.eql([])
      tracer.serverSend(ss.payload, ss.briefcase)
      expect(tracer.collect().length).to.equal(2)
    })
    it('both is collected when the cache is locked until SS', function () {
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

      tracer.serverRecv(sr.payload, sr.duffelBag, { cacheMode: tracer.CACHE_MODES.RETAIN_UNTIL_SS })
      expect(tracer.collect()).to.eql([])
      tracer.serverSend(ss.payload, ss.briefcase)
      expect(tracer.collect().length).to.be.equal(2)
    })

    it('both is dropped when the cache is locked until SS and SS is skipped', function () {
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

      tracer.serverRecv(sr.payload, sr.duffelBag, { cacheMode: tracer.CACHE_MODES.RETAIN_UNTIL_SS })
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
    it('is collected even when not in a transaction', function () {
      var tracer = new Collector(options)
      var payload = { }
      var briefcase = {
        severity: tracer.mustCollectSeverity
      }
      tracer.clientSend(payload, briefcase)
      expect(tracer.collect().length).to.eql(1)
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
      tracer.serverRecv(sr.payload, sr.duffelBag)
      tracer.clientSend(cs.payload, cs.briefcase)
      expect(tracer.collect().length).to.eql(2)
    })
  })
  describe('SR - CS - CR - SS', function () {
    it('CR sets mustCollect: CS, CR, SS is collected but SR not because it has expired', function () {
      var _options = defaults({ eventTtl: 2 }, options)
      var tracer = new Collector(_options)
      var sr = {
        payload: { },
        duffelBag: {
          communicationId: 'id',
          transactionId: 'trId',
          severity: tracer.mustCollectSeverity + 1
        }
      }
      tracer.serverRecv(sr.payload, sr.duffelBag)
      expect(tracer.collect()).to.eql([])
      var cs = {
        payload: {},
        briefcase: {
          communication: {
            id: sr.duffelBag.communicationId,
            transactionId: sr.duffelBag.transactionId
          }
        }
      }
      var csResult = tracer.clientSend(cs.payload, cs.briefcase)
      expect(tracer.collect()).to.eql([])
      var cr = {
        payload: { },
        duffelBag: {
          timestamp: 1,
          severity: tracer.mustCollectSeverity
        },
        briefcase: {
          communication: {
            id: sr.duffelBag.communicationId,
            transactionId: sr.duffelBag.transactionId
          },
          csCtx: csResult.briefcase.csCtx
        }
      }
      tracer.clientRecv(cr.payload, cr.duffelBag, cr.briefcase)
      var partialData = tracer.collect()
      expect(partialData.length).to.eql(2)
      expect(partialData[0].t).to.eql('cs')
      expect(partialData[1].t).to.eql('cr')
      expect(tracer.collect().length).to.eql(0)
      var ss = {
        payload: {},
        briefcase: {
          communication: {
            id: sr.duffelBag.communicationId,
            transactionId: sr.duffelBag.transactionId
          }
        }
      }
      tracer.serverSend(ss.payload, ss.briefcase)
      expect(tracer.collect().length).to.eql(1)
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
})
