var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Events () {
  EventEmitter.call(this);
}

util.inherits(Events, EventEmitter);

function create (options) {
  return new Events(options);
}

Events.prototype.ERROR = 'error';
Events.prototype.USER_SENT_EVENT = 'user_sent_event';
Events.prototype.TRACE_SERVICE_KEY = 'trace_service_key';
Events.prototype.HTTP_TRANSACTION = 'http_transaction';
Events.prototype.HTTP_TRANSACTION_STACK_TRACE = 'http_transaction_stack_trace';

module.exports.create = create;
