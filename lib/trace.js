var debug = require('debug')('risingstack/trace')
var Agent = require('./agent')
var Instrumentation = require('./instrumentations')
var ConfigReader = require('./utils/configReader')

var traceNoop = {
  report: function () {},
  reportError: function () {},
  getTransactionId: function () {},
  sendMemorySnapshot: function () {},
  recordMetric: function () {},
  incrementMetric: function () {},
  stop: function (cb) {
    if (typeof cb === 'function') {
      cb()
    }
  }
}

function Trace (config) {
  this._agent = Agent.create({
    config: config
  })

  this._instrumentation = Instrumentation.create({
    agent: this._agent,
    config: config
  })

  this._agent.start()
}

Trace.prototype.report = function (name) {
  var data = Array.prototype.slice.call(arguments, 1)
  debug('trace.report', name, data)
  if (typeof name !== 'string' || name === '') {
    throw new Error('First parameter invalid, should be a string')
  }
  var briefcase = this._agent.storage.get('tracer.briefcase')
  this._agent.tracer.collector.userSentEvent(briefcase, name, data)
}

Trace.prototype.reportError = function (errorName, error) {
  debug('trace.reportError', error)
  if (typeof errorName !== 'string' || errorName === '') {
    throw new Error('First parameter invalid, should be a string')
  }
  var briefcase = this._agent.storage.get('tracer.briefcase')
  this._agent.tracer.collector.userSentError(briefcase, errorName, error)
}

Trace.prototype.getTransactionId = function () {
  var briefcase = this._agent.storage.get('tracer.briefcase')
  var transactionId = this._agent.tracer.collector.getTransactionId(briefcase)

  debug('trace.getTransactionId', transactionId)

  return transactionId
}

Trace.prototype.sendMemorySnapshot = function () {
  this._agent.memoryProfiler.sendSnapshot()
}

Trace.prototype.incrementMetric = function (name, amount) {
  this._agent.customMetrics.increment(name, amount)
}

Trace.prototype.recordMetric = function (name, value) {
  this._agent.customMetrics.record(name, value)
}

Trace.prototype.stop = function (cb) {
  this._agent.stop()
  if (typeof cb === 'function') {
    cb()
  }
}

module.exports.Trace = Trace
module.exports.noop = traceNoop

module.exports.create = function () {
  if (process.env.NODE_ENV === 'test') {
    debug('#create', 'Trace does not start as NODE_ENV is set to test')
    return module.exports.noop
  }

  // default to no-op newrelic agent is present as well
  if (require.cache.__NR_cache) {
    console.error('error: [trace]', 'Make sure to require Trace before New Relic, otherwise Trace won\'t start')
    return module.exports.noop
  }

  try {
    var configReader = ConfigReader.create()
    var config = configReader.getConfig()

    return new module.exports.Trace(config)
  } catch (ex) {
    console.error('error: [trace]', ex.message)
    console.error('error: [trace]', 'For more information check the docs: https://trace-docs.risingstack.com/docs/troubleshooting')
    return module.exports.noop
  }
}
