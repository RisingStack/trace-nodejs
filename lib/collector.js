var events = require('events');
var util = require('util');

var request = require('superagent');
var debugModule = require('debug');

var debug = debugModule('seetru:collector:clientrequest');
var apiUrl = 'http://localhost:8000/data';

/*
 * @class Collector
 * @constructs Collector
 * @extends events.EventEmitter
 */
function Collector (options) {
  events.EventEmitter.call(this);

  this.app = options.app;

  this.on(Collector.CLIENT_SEND, this.onClientSend);
  this.on(Collector.CLIENT_RECV, this.onClientReceive);
  this.on(Collector.SERVER_SEND, this.onServerSend);
  this.on(Collector.SERVER_RECV, this.onServerReceive);
}

util.inherits(Collector, events.EventEmitter);

Collector.prototype.onClientSend = function (data) {
  data.type = Collector.CLIENT_SEND;
  debug(Collector.CLIENT_SEND, data);
  this.send(data);
};

Collector.prototype.onClientReceive = function (data) {
  data.type = Collector.CLIENT_RECV;
  debug(Collector.CLIENT_RECV, data);
  this.send(data);
};

Collector.prototype.onServerSend = function (data) {
  data.type = Collector.SERVER_SEND;
  debug(Collector.SERVER_SEND, data);
  this.send(data);
};

Collector.prototype.onServerReceive = function (data) {
  data.type = Collector.SERVER_RECV;
  debug(Collector.SERVER_SEND, data);
  this.send(data);
};

/*
 * @method send
 * @param {Object} data
 */
Collector.prototype.send = function (data) {
  data.application = this.app;

  request
    .post(apiUrl)
    .send(data)
    .end(function () {});

};

// Statics
Collector.CLIENT_SEND = 'cs';
Collector.CLIENT_RECV = 'cr';
Collector.SERVER_SEND = 'ss';
Collector.SERVER_RECV = 'sr';

// Module interface
module.exports = Collector;
