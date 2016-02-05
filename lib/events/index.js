var util = require('util')
var EventEmitter = require('events').EventEmitter

function Events () {
  EventEmitter.call(this)
}

util.inherits(Events, EventEmitter)

function create (options) {
  return new Events(options)
}

Events.prototype.ERROR = 'error'
Events.prototype.USER_SENT_EVENT = 'user_sent_event'
Events.prototype.USER_SENT_EVENT_ERROR = 'user_sent_event_error'
Events.prototype.TRACE_SERVICE_KEY = 'trace_service_key'
Events.prototype.HTTP_TRANSACTION = 'http_transaction'
Events.prototype.HTTP_TRANSACTION_STACK_TRACE = 'http_transaction_stack_trace'
Events.prototype.RPM_METRICS = 'rpm_metrics'
Events.prototype.APM_METRICS = 'apm_metrics'

module.exports.create = create
