var events = require('events');
var util = require('util');
var fs = require('fs');
var path = require('path');

var debugModule = require('debug');

var debug = debugModule('seetru:collector:clientrequest');

var store = {};

/*
 * @class Collector
 * @constructs Collector
 * @extends events.EventEmitter
 */
function Collector(options) {
  events.EventEmitter.call(this);

  this.app = options.app;
  this.service = options.service;

  this.on(Collector.CLIENT_SEND, this.onClientSend);
  this.on(Collector.CLIENT_RECV, this.onClientReceive);
  this.on(Collector.SERVER_SEND, this.onServerSend);
  this.on(Collector.SERVER_RECV, this.onServerReceive);
}

util.inherits(Collector, events.EventEmitter);

Collector.prototype.onClientSend = function (data) {
  store[data.id] = store[data.id] || {
    events: []
  };

  var trace = store[data.id];

  debug(Collector.CLIENT_SEND, data);

  trace.trace = data.id;
  trace.service = this.service;
  trace.events.push({
    time: data.time,
    type: Collector.CLIENT_SEND
  });
};

Collector.prototype.onClientReceive = function (data) {
  store[data.id] = store[data.id] || {
    events: []
  };

  var trace = store[data.id];

  debug(Collector.CLIENT_RECV, data);

  trace.trace = data.id;
  trace.service = this.service;
  trace.events.push({
    time: data.time,
    type: Collector.CLIENT_RECV
  });
};

Collector.prototype.onServerSend = function (data) {
  store[data.id] = store[data.id] || {
    events: []
  };

  var trace = store[data.id];

  debug(Collector.SERVER_SEND, data);

  trace.trace = data.id;
  trace.service = this.service;
  trace.events.push({
    time: data.time,
    type: Collector.SERVER_SEND
  });

  fs.writeFile(path.join(__dirname, util.format('../seetru_trace_%s.log', this.service)),
    JSON.stringify(trace) + '\n', {flag: 'a'});
};

Collector.prototype.onServerReceive = function (data) {

  store[data.id] = store[data.id] || {
    events: []
  };

  var trace = store[data.id];

  var parentId;
  var originTime;
  var requestInfo;

  if (data.seetruData) {
    requestInfo = data.seetruData.split('-');
    originTime = requestInfo[0];
    parentId = requestInfo[1];
  }

  debug(Collector.SERVER_RECV, data);

  trace.trace = data.id;
  trace.service = this.service;
  trace.origin = originTime;
  trace.parent = parentId;
  trace.events.push({
    time: data.time,
    type: Collector.SERVER_RECV
  });

};

// Statics
Collector.CLIENT_SEND = 'cs';
Collector.CLIENT_RECV = 'cr';
Collector.SERVER_SEND = 'ss';
Collector.SERVER_RECV = 'sr';

// Module interface
module.exports = Collector;
