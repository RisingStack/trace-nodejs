var session = require('continuation-local-storage').createNamespace('trace')
require('./cls')(session)

var format = require('util').format
var debug = require('debug')('risingstack/trace')

var Events = require('./events')
var configReader = require('./utils/configReader').create()

// providers and reporters
var providers = require('./providers')
var reporters = require('./reporters')

function Trace () {
  this.events = Events.create()

  try {
    this.config = configReader.getConfig()
    this.reporter = reporters.trace.create(this.config)
  } catch (ex) {
    console.error(format('%s TRACE: An error occured during config reading: %s', new Date(), ex))
    return
  }

  providers.httpTransaction.create(this.events, this.config)
  providers.apmMetrics.create(this.events, this.config)
  this.reporter.setEventBus(this.events)

  this.events.on('error', function (error) {
    debug('error: %s', error)
  })
}

Trace.prototype.report = function (name) {
  var data = Array.prototype.slice.call(arguments, 1)
  debug('trace.report', name, data)
  if (typeof name !== 'string' || name === '') {
    throw new Error('First parameter invalid')
  }
  this.events.emit(this.events.USER_SENT_EVENT, name, data)
}

Trace.prototype.getTransactionId = function (getTransactionId) {
  var transactionId = session.get('request-id')

  debug('trace.getTransactionId', transactionId)

  return transactionId
}

module.exports = new Trace()
