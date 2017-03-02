'use strict'
var inherits = require('util').inherits
var Agent = require('../../agent')
var reservoirSampler = require('../../util/samplers/reservoir')

function CustomMetrics (options) {
  this.name = 'Metrics/Custom'
  this.collectorApi = options.collectorApi
  this.config = options.config
  this.collectInterval = this.config.collectInterval
  this.samplerLimit = 15

  this.incrementMetrics = {}
  this.recordMetrics = {}

  Agent.call(this, 'Metrics/Custom', this.collectInterval, this.sendMetrics.bind(this))
}

inherits(CustomMetrics, Agent)

CustomMetrics.prototype.increment = function (name, amount) {
  if (!name) {
    throw new Error('Name is needed for CustomMetrics.increment')
  }
  amount = amount || 1
  if (this.incrementMetrics[name]) {
    this.incrementMetrics[name] += amount
  } else {
    this.incrementMetrics[name] = amount
  }
}

CustomMetrics.prototype.record = function (name, value) {
  if (!name) {
    throw new Error('Name is needed for CustomMetrics.record')
  }
  if (typeof value === 'undefined') {
    throw new Error('Name is needed for CustomMetrics.record')
  }

  if (this.recordMetrics[name]) {
    var metric = this.recordMetrics[name]
    metric.sampler.add(value)
    metric.sum += value
    metric.min = metric.min < value ? metric.min : value
    metric.max = metric.max > value ? metric.max : value
    ++metric.count
  } else {
    this.recordMetrics[name] = {
      sampler: reservoirSampler.create(this.samplerLimit),
      count: 1,
      sum: value,
      max: value,
      min: value
    }
    this.recordMetrics[name].sampler.add(value)
  }
}

CustomMetrics.prototype.sendMetrics = function (callback) {
  callback = callback || function () {}
  var self = this
  Object.keys(this.recordMetrics).forEach(function (key) {
    prepareRecordMetric(self.recordMetrics[key])
  })
  this.collectorApi.sendCustomMetrics({
    incrementMetrics: this.incrementMetrics,
    recordMetrics: this.recordMetrics
  }, callback)

  this.incrementMetrics = {}
  this.recordMetrics = {}
}

CustomMetrics.prototype.stop = function (callback) {
  Agent.prototype.stop.call(this)
  this.sendMetrics(callback)
}

function create (options) {
  return new CustomMetrics(options)
}

function prepareRecordMetric (recordMetric) {
  var samples = recordMetric.sampler.flush()
  delete recordMetric.sampler
  recordMetric.samples = samples
  recordMetric.avg = recordMetric.sum / recordMetric.count
  delete recordMetric.sum
}

module.exports = CustomMetrics
module.exports.create = create
