/*jshint unused:false*/
var format = require('util').format;

var debug = require('debug')('risingstack/trace');
var session = require('continuation-local-storage').createNamespace('trace');

var Events = require('./events');
var configReader = require('./utils/configReader').create();

// providers and reporters
var providers = require('./providers');

function Trace() {
  this.events = Events.create();

  try {
    this.config = configReader.getConfig();
  } catch (ex) {
    console.error(format('%s TRACE: An errror occured during config reading: %s', new Date(), ex));
    return;
  }

  providers.httpTransaction.create(this.events, this.config);
  this.config.reporter.setEventBus(this.events);

  this.events.on('error', function (error) {
    debug('error: %s', error);
  });
}

Trace.prototype.report = function (data) {
  debug('trace.report', data);
  this.events.emit('user_sent_event', data);
};

Trace.prototype.getTransactionId = function (getTransactionId) {
  var transactionId = session.get('request-id');

  debug('trace.getTransactionId', transactionId);

  return transactionId;
};

module.exports = new Trace();
