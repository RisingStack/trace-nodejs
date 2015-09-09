/* jshint noyield: true */
/* jshint esnext: true */

/* Pull trace in */
require('../../../');

var express = require('express');
var request = require('superagent');
var format = require('util').format;
var resolve = require('url').resolve;

var config = require('../config');

var app = express();

app.get('/', function (req, res) {
  var requestUrl = resolve(format(config.templateUrl, config.portBase + 1), '/');
  request
    .get(requestUrl)
    .end(function (err) {
      if (err) {
        return res.json({
          message: 'error'
        })
        .status(424);
      }

      res.json({
        message: 'success'
      });
    });
})


app.get('/error', function () {
  throw new Error('Error happened');
});

app.get('/error-dep', function (req, res) {
  var requestUrl = resolve(format(config.templateUrl, config.portBase + 1), '/error');
  request
    .get(requestUrl)
    .end(function (err) {
      if (err) {
        return res.json({
          message: 'error'
        })
        .status(424);
      }

      res.json({
        message: 'success'
      });
    });
});

app.listen(process.env.PORT, function () {
  console.log('service 1 is running on port: ' + process.env.PORT);
});

