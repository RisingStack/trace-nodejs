var path = require('path');

var express = require('express');
var collectorConfig = require('../../lib/config');

// override log file path
collectorConfig.logFilePath = path.join(__dirname, '/');

// use trace collector
require('../../lib');

var failingServer = express();

failingServer.get('/', function () {
  setTimeout(function () {
    throw new Error('Very error');
  }, 0);
});

failingServer.listen(15124, function (err) {
  if (err) {
    throw err;
  }
  console.log('listening');
});
