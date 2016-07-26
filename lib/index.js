var Agent = require('./agent')
var Instrumentation = require('./instrumentations')

var debug = require('debug')('risingstack/trace')

var ConfigReader = require('./utils/configReader')

var traceNoop = {
  report: function () {},
  reportError: function () {},
  getTransactionId: function () {}
}

function Trace () {
  if (process.env.NODE_ENV === 'test') {
    return traceNoop
  }

  this.configReader = ConfigReader.create()

  try {
    this.config = this.configReader.getConfig()
  } catch (ex) {
    console.error('error: [trace]', ex.message)
    return traceNoop
  }

  // warn the user if the newrelic agent is present as well
  if (require.cache.__NR_cache) {
    console.error('error: [trace]', 'Make sure to require Trace before New Relic, otherwise Trace won\'t start')
    return traceNoop
  }

  this.agent = Agent.create({
    config: this.config
  })

  Instrumentation.create({
    agent: this.agent,
    config: this.config
  })

  this.agent.start()
}

Trace.prototype.report = function (name) {
  var data = Array.prototype.slice.call(arguments, 1)
  debug('trace.report', name, data)
  if (typeof name !== 'string' || name === '') {
    throw new Error('First parameter invalid, must be a string')
  }
  this.agent.report(name, data)
}

Trace.prototype.reportError = function (errorName, error) {
  debug('trace.reportError', error)
  if (typeof errorName !== 'string' || errorName === '') {
    throw new Error('First parameter invalid, must be a string')
  }
  if (error.message !== 'string') {
    throw new Error('Second parameter invalid, must be an Error object')
  }
  this.agent.reportError(errorName, error)
}

Trace.prototype.getTransactionId = function () {
  var transactionId = this.agent.getRequestId()

  debug('trace.getTransactionId', transactionId)

  return transactionId
}

Trace.prototype.sendMemorySnapshot = function () {
  this.agent.memoryProfiler.sendSnapshot()
}

module.exports = new Trace()
