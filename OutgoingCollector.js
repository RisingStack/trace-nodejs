var events = require('events');
var util = require('util');

var debugModule = require('debug');

// TODO: remove in prod
debugModule.enable('seetru:*');

var debug = debugModule('seetru:collector:outgoing');

/*
 * @class OutgoingCollector
 * @constructs OutgoingCollector
 * @extends events.EventEmitter
 */
function OutgoingCollector() {
  events.EventEmitter.call(this);

  this.on(OutgoingCollector.REQUEST_STARTED, this.onRequestStarted);
  this.on(OutgoingCollector.REQUEST_ENDED, this.onRequestEnded);
}

// Inherit from EventEmitter
util.inherits(OutgoingCollector, events.EventEmitter);

/*
 * @method onRequestStarted
 * @param {Object} data
 */
OutgoingCollector.prototype.onRequestStarted = function (data) {
  debug(OutgoingCollector.REQUEST_STARTED, data);
};

/*
 * @method onRequestEnded
 * @param {Object} data
 */
OutgoingCollector.prototype.onRequestEnded = function (data) {
  debug(OutgoingCollector.REQUEST_ENDED, data);
};

// Statics
OutgoingCollector.REQUEST_STARTED = 'REQUEST_STARTED';
OutgoingCollector.REQUEST_ENDED = 'REQUEST_ENDED';

// Module interface
module.exports = OutgoingCollector;
