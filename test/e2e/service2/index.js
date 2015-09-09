/* jshint noyield: true */
/* jshint esnext: true */

/* Pull trace in */
require('../../../');

var express = require('express');

var app = express();

app.get('/', function (req, res) {
  res.json({
    message: 'success'
  });
});

app.get('/error', function (req, res) {
  throw new Error('Error happened');
});

app.listen(process.env.PORT, function () {
  console.log('service 2 is running on port: ' + process.env.PORT);
});

