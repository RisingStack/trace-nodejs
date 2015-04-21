var seetru = require('./../lib/index')({
  app: 'Users',
  service: 1
});

var express = require('express');
var superagent = require('superagent');

var app = express();

var getNamespace = require('continuation-local-storage').getNamespace;
var session = getNamespace('seetru');

app.get('/', function (req, res) {

  var req = Math.floor(Math.random() * 1000);

  superagent
    .get('http://localhost:3001/users/1')
    .end(function(err, response) {

      b;
      seetru.report({
        status: 'doing',
        data: 'eee'
      });

      superagent
        .get('http://localhost:3003/users/1')
        .end(function(err, response) {
          seetru.report({
            status: 'done',
            data: 'eee'
          });
          res.json(response.body);
        });

    });

});


app.get('/alma', function (req, res) {
  var latency = Math.floor(Math.random() * 80) + 20;

  setTimeout(function () {
    res.json({status: ok});
  }, latency);
});

var server = app.listen(3000, function (err) {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Express app listening at http://%s:%s', host, port)
});
