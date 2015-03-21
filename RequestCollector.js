var events = require('events');
var util = require('util');

var debugModule = require('debug');

debugModule.enable('seetru:*');

var debug = debugModule('seetru:request:collector');

/*
 * @class RequestCollector
 * @constructs RequestCollector
 * @extends events.EventEmitter
 */
function RequestCollector() {
  var _this = this;

  events.EventEmitter.call(this);

  this.on(RequestCollector.REQUEST_STARTED, this.onRequestStarted);
  this.on(RequestCollector.REQUEST_ENDED, this.onRequestEnded);
}

// Inherit from EventEmitter
util.inherits(RequestCollector, events.EventEmitter);

/*
 * @method onRequestStarted
 * @param {Object} data
 */
RequestCollector.prototype.onRequestStarted = function (data) {
  debug(RequestCollector.REQUEST_STARTED, data);
};

/*
 * @method onRequestEnded
 * @param {Object} data
 */
RequestCollector.prototype.onRequestEnded = function (data) {
  debug(RequestCollector.REQUEST_ENDED, data);
};

// Statics
RequestCollector.REQUEST_STARTED = 'REQUEST_STARTED';
RequestCollector.REQUEST_ENDED = 'REQUEST_ENDED';

// Module interface
module.exports = RequestCollector;
