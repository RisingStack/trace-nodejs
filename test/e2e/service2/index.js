/* jshint noyield: true */
/* jshint esnext: true */

/* Pull trace in */
require('../../../');

var koa = require('koa');
var Router = require('koa-router');

var router = new Router();

router.get('/', function * () {
  this.body = {
    message: 'success'
  };
  this.status = 200;
});

router.get('/error', function * () {
  throw new Error('Error happened');
});

var app = koa();

app.use(router.middleware());

app.listen(process.env.PORT, function () {
  console.log('service 2 is running on port: ' + process.env.PORT);
});

