var events = require('events');
var util = require('util');

var request = require('superagent');
var debugModule = require('debug');

var debug = debugModule('seetru:collector:clientrequest');
var apiUrl = 'http://localhost:8000/data';

/*
 * @class ClientRequestCollector
 * @constructs ClientRequestCollector
 * @extends events.EventEmitter
 */
function OutgoingCollector (options) {
  events.EventEmitter.call(this);

  this.app = options.app;

  this.on(OutgoingCollector.STARTED, this.onRequestStarted);
  this.on(OutgoingCollector.FINISHED, this.onRequestFinished);
}

// Inherit from EventEmitter
util.inherits(OutgoingCollector, events.EventEmitter);

/*
 * @method onRequestStarted
 * @param {Object} data
 */
OutgoingCollector.prototype.onRequestStarted = function (data) {
  data.type = 'client_request_started';
  data.application = this.app;

  request
    .post(apiUrl)
    .send(data)
    .end(function (err) {});

  debug(OutgoingCollector.STARTED, data);
};

/*
 * @method onRequestEnded
 * @param {Object} data
 */
OutgoingCollector.prototype.onRequestFinished = function (data) {
  data.type = 'client_request_finished';
  data.application = this.app;

  request
    .post(apiUrl)
    .send(data)
    .end(function (err) {});

  debug(OutgoingCollector.FINISHED, data);
};

// Statics
OutgoingCollector.STARTED = 'STARTED';
OutgoingCollector.FINISHED = 'FINISHED';

// Module interface
module.exports = OutgoingCollector;
