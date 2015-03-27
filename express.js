require('./lib')({
  app: 'express'
});

var express = require('express');
var superagent = require('superagent');

var app = express();

app.get('/', function (req, res) {

  console.log('Express Request hit at', process.hrtime());

  superagent
    .get('http://localhost:3001/users/1')
    .end(function(err, response) {

      superagent
        .get('http://localhost:3003/users/1')
        .end(function(err, response) {
          res.json(response.body);
        });

    });

});

var server = app.listen(3000, function (err) {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Express app listening at http://%s:%s', host, port)
});
