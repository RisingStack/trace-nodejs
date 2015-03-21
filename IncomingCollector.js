var events = require('events');
var util = require('util');

var debugModule = require('debug');

// TODO: remove in prod
debugModule.enable('seetru:*');

var debug = debugModule('seetru:collector:incoming');

/*
 * @class IncomingCollector
 * @constructs IncomingCollector
 * @extends events.EventEmitter
 */
function IncomingCollector() {
  events.EventEmitter.call(this);

  this.on(IncomingCollector.REQUEST_STARTED, this.onRequestStarted);
  this.on(IncomingCollector.REQUEST_ENDED, this.onRequestEnded);
}

// Inherit from EventEmitter
util.inherits(IncomingCollector, events.EventEmitter);

/*
 * @method onRequestStarted
 * @param {Object} data
 */
IncomingCollector.prototype.onRequestStarted = function (data) {
  debug(IncomingCollector.REQUEST_STARTED, data);
};

/*
 * @method onRequestEnded
 * @param {Object} data
 */
IncomingCollector.prototype.onRequestEnded = function (data) {
  debug(IncomingCollector.REQUEST_ENDED, data);
};

// Statics
IncomingCollector.REQUEST_STARTED = 'REQUEST_STARTED';
IncomingCollector.REQUEST_ENDED = 'REQUEST_ENDED';

// Module interface
module.exports = IncomingCollector;
