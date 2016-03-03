var Agent = require('./agent')
var Instrumentation = require('./instrumentations')

var format = require('util').format
var debug = require('debug')('risingstack/trace')

var ConfigReader = require('./utils/configReader')

function Trace () {
  this.configReader = ConfigReader.create()
  try {
    this.config = this.configReader.getConfig()
  } catch (ex) {
    console.error(format('%s trace: error: %s', new Date(), ex.message))
    return
  }

  // warn the user if the newrelic agent is present as well
  if (require.cache.__NR_cache) {
    console.error('Make sure to require Trace before New Relic, otherwise Trace won\'t start')
    return
  }

  this.agent = Agent.create({
    config: this.config
  })

  Instrumentation.create({
    agent: this.agent
  })
}

Trace.prototype.report = function (name) {
  var data = Array.prototype.slice.call(arguments, 1)
  debug('trace.report', name, data)
  if (typeof name !== 'string' || name === '') {
    throw new Error('First parameter invalid, should be a string')
  }
  this.agent.report(name, data)
}

Trace.prototype.reportError = function (errorName, error) {
  debug('trace.reportError', error)
  if (typeof errorName !== 'string' || errorName === '') {
    throw new Error('First parameter invalid, should be a string')
  }
  this.agent.reportError(errorName, error)
}

Trace.prototype.getTransactionId = function () {
  var transactionId = this.agent.getTransactionId()

  debug('trace.getTransactionId', transactionId)

  return transactionId
}

module.exports = new Trace()
