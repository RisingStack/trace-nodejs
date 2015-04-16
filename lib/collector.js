var events = require('events');
var util = require('util');
var fs = require('fs');
var path = require('path');

var debugModule = require('debug');
var superagent = require('superagent');

var debug = debugModule('seetru:collector:clientrequest');

var store = {};

var COLLECT_INTERVAL = 60 * 1000;

/*
 * @class Collector
 * @constructs Collector
 * @extends events.EventEmitter
 */
function Collector(options) {
  var _this = this;

  events.EventEmitter.call(this);

  this.app = options.app;
  this.service = options.service;

  this.on(Collector.CLIENT_SEND, this.onClientSend);
  this.on(Collector.CLIENT_RECV, this.onClientReceive);
  this.on(Collector.SERVER_SEND, this.onServerSend);
  this.on(Collector.SERVER_RECV, this.onServerReceive);

  this.updateLogFile();

  setInterval(function () {
    _this.send();
  }, COLLECT_INTERVAL);
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
  var _this = this;
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

  fs.writeFile(_this.logFile,
    JSON.stringify(trace) + ',\n', {flag: 'a'});

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

Collector.prototype.updateLogFile = function () {
  this.logFile = path.join(__dirname, util.format('../seetru_trace_%s_%s.log',
    this.service, Date.now()));
};

Collector.prototype.send = function () {

  var _oldLogFile = this.logFile;

  this.updateLogFile();

  fs.readFile(_oldLogFile, 'utf-8', function (err, data) {
    if (err && err.code === 'ENOENT') {
      return;
    }
    if (err) {
      return console.log(err);
    }

    data = '[' + data.substring(0, data.length - 2) + ']';
    data = JSON.parse(data);

    superagent
      .post('/spans')
      .send(data)
      .end(function (err) {
        if (err) {
          return console.log(err);
        }

        fs.unlink(_oldLogFile);
      });

  });

};

// Statics
Collector.CLIENT_SEND = 'cs';
Collector.CLIENT_RECV = 'cr';
Collector.SERVER_SEND = 'ss';
Collector.SERVER_RECV = 'sr';

// Module interface
module.exports = Collector;
