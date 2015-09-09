/* jshint noyield: true */
/* jshint esnext: true */
var fs = require('fs');
var https = require('https');
var path = require('path');

var koa = require('koa');
var Router = require('koa-router');
var bodyParser = require('koa-bodyparser');

var router = new Router();

var credentials = {
  key: fs.readFileSync(path.join(__dirname, 'cert/server.key'), 'utf-8'),
  cert: fs.readFileSync(path.join(__dirname, 'cert/server.crt'), 'utf-8')
};

router.post('/service', function * () {
  if (this.request.body.name === 'service1') {
    this.body = {
      key: 1
    };
    this.status = 200;
    return;
  }
  if (this.request.body.name === 'service2') {
    this.body = {
      key: 2
    };
    this.status = 200;
    return;
  }
  this.body = {
    message: 'error'
  };
  this.status = 400;
});

router.post('/service/sample', function * () {
  this.body = {
    message: 'error'
  };
  this.status = 400;
});

var app = koa();

app.use(bodyParser());
app.use(router.middleware());

https
  .createServer(credentials, app.callback())
  .listen(4000, function () {
    console.log('collector server started');
  });
