var events = require('events');
var util = require('util');

var request = require('superagent');
var debugModule = require('debug');

var debug = debugModule('seetru:collector:incomingmessage');
var apiUrl = 'http://localhost:8000/data';

/*
 * @class IncomingMessageCollector
 * @constructs IncomingMessageCollector
 * @extends events.EventEmitter
 */
function IncomingCollector (options) {
  events.EventEmitter.call(this);

  this.app = options.app;

  this.on(IncomingCollector.STARTED, this.onRequestStarted);
  this.on(IncomingCollector.FINISHED, this.onRequestFinished);
}

// Inherit from EventEmitter
util.inherits(IncomingCollector, events.EventEmitter);

/*
 * @method onRequestStarted
 * @param {Object} data
 */
IncomingCollector.prototype.onRequestStarted = function (data) {
  data.type = 'incoming_message_started';
  data.application = this.app;

  request
    .post(apiUrl)
    .send(data)
    .end(function (err) {});


  debug(IncomingCollector.STARTED, data);
};

/*
 * @method onRequestEnded
 * @param {Object} data
 */
IncomingCollector.prototype.onRequestFinished = function (data) {
  data.type = 'incoming_message_finished';
  data.application = this.app;

  request
    .post(apiUrl)
    .send(data)
    .end(function (err) {});

  debug(IncomingCollector.FINISHED, data);
};

// Statics
IncomingCollector.STARTED = 'STARTED';
IncomingCollector.FINISHED = 'FINISHED';

// Module interface
module.exports = IncomingCollector;
