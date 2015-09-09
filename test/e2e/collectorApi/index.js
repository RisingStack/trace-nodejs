/* jshint noyield: true */
/* jshint esnext: true */
var fs = require('fs');
var https = require('https');
var path = require('path');

var express = require('express');
var bodyParser = require('body-parser');

var credentials = {
  key: fs.readFileSync(path.join(__dirname, 'cert/server.key'), 'utf-8'),
  cert: fs.readFileSync(path.join(__dirname, 'cert/server.crt'), 'utf-8')
};

var app = express()
  .use(bodyParser.json());

app.post('/service', function (req, res) {
  if (req.body.name === 'service1') {
    return res.json({
        key: 1
      });
  }
  if (req.body.name === 'service2') {
    return res.json({
      key: 2
    });
  }

  return res.json({
    message: 'error'
  });
});

app.post('/service/sample', function (req, res) {
  return res.json({
    message: 'error'
  });
});

https
  .createServer(credentials, app)
  .listen(4000, function () {
    console.log('collector server started');
  });

