var seetru = require('./../lib/index')({
  app: 'Users',
  blackListHosts: []
});

var express = require('express');
var superagent = require('superagent');

var app = express();



app.get('/', function (req, res) {

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

app.get('/alma', function (req, res) {
  var latency = Math.floor(Math.random() * 80) + 20;

  setTimeout(function () {
    res.json({status: 'ok'});
  }, latency);
});

var server = app.listen(3000, function (err) {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Express app listening at http://%s:%s', host, port)
});
