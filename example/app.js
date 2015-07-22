var express = require('express');
var trace = require('@risingstack/trace');

var app = express();

app.get('/', function (req, res) {
  res.json({
    data: [
      1,
      2,
      3
    ]
  })
});

app.listen(3000, function(err) {
  if (err) {
    throw err;
  }

  console.log('app is listening');
});
