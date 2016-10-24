'use strict'

var Collector = require('./collector')
var levels = require('./severity')
var url = require('url')
var inherits = require('util').inherits
var Agent = require('../agent')

function Tracer (options) {
  this.collectInterval = options.config.collectInterval
  this.serviceName = options.config.serviceName
  this.processId = options.config.system.processId
  this.hostname = options.config.system.hostname
  this.mustCollectSeverity = levels.ERROR
  this.sampleUrl = url.resolve(options.config.collectorApiUrl, options.config.collectorApiSampleEndpoint)

  // init required variables
  this.collector = new Collector({
    eventTtl: 3,
    noStack: options.config.disableStackTrace
  })
  this._api = options.collectorApi

  Agent.call(this, 'Tracer', this.collectInterval, this.send.bind(this))
}

inherits(Tracer, Agent)

Tracer.prototype.initialize = function (opts) {
  Agent.prototype.initialize.call(this, opts)
  this.collector.serviceKey = this.serviceKey = opts.serviceKey
}

Tracer.prototype.send = function (isSync) {
  var events = this.collector.collect()
  if (events.length) {
    var data = {
      i: { p: this.processId, d: this.hostname },
      s: { n: this.serviceName, k: this.serviceKey },
      e: events
    }
    if (isSync === true) {
      this._api._sendSync(this.sampleUrl, data, {
        headers: {
          'x-document-schema': 'CollectorTransactionRaw:1.0.0'
        }
      })
    } else {
      this._api._send(this.sampleUrl, data, null, {
        headers: {
          'x-document-schema': 'CollectorTransactionRaw:1.0.0'
        }
      })
    }
  }
}

function create (options) {
  return new Tracer(options)
}

module.exports = Tracer
module.exports.create = create
