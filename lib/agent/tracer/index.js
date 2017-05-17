'use strict'
var debug = require('../../utils/debug')('agent:tracer')
var Collector = require('./collector')
var levels = require('./severity')
var url = require('url')
var Timer = require('../timer')
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
    noStack: options.config.disableStackTrace,
    samplerLimit: options.config.samplerLimit
  })
  this._api = options.collectorApi

  Agent.call(this, 'Tracer', this.collectInterval, this.send.bind(this))
  this.sampleTimer = new Timer(this.sample.bind(this), ~~(this.collectInterval / 2))
}

inherits(Tracer, Agent)

Tracer.prototype.initialize = function (opts) {
  Agent.prototype.initialize.call(this, opts)
  this.serviceKey = opts.serviceKey
  this.collector.setServiceKey(opts.serviceKey)
}

Tracer.prototype.start = function () {
  Agent.prototype.start.call(this)
  this.sampleTimer.start()
}

Tracer.prototype.sample = function () {
  this.collector.sample()
}

Tracer.prototype.sampleAll = function () {
  this.collector.sampleAll()
}

Tracer.prototype.send = function (isSync, callback) {
  callback = callback || function () {}
  var events = this.collector.flush()
  if (events.length) {
    debug.info('send', 'Number of events to send: ' + events.length)
    var data = {
      i: { p: this.processId, d: this.hostname },
      s: { n: this.serviceName, k: this.serviceKey },
      e: events
    }

    if (isSync === true) {
      try {
        this._api._sendSync(this.sampleUrl, data, {
          compress: true,
          headers: {
            'x-document-schema': 'CollectorTransactionRaw:1.1.0'
          }
        })
      } catch (err) {
        callback(err)
      }
    } else {
      this._api._send(this.sampleUrl, data, callback, {
        compress: true,
        headers: {
          'x-document-schema': 'CollectorTransactionRaw:1.1.0'
        }
      })
    }
  } else {
    callback()
  }
}

Tracer.prototype.stop = function (callback) {
  this.sampleTimer.end()
  var self = this
  this.send(false, function (err) {
    Agent.prototype.stop.call(self, function () {
      callback(err)
    })
  })
}

function create (options) {
  return new Tracer(options)
}

module.exports = Tracer
module.exports.create = create
