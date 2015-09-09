/* jshint noyield: true */
/* jshint esnext: true */

/* Pull trace in */
require('../../../');

var koa = require('koa');
var request = require('superagent');
var Router = require('koa-router');
var format = require('util').format;
var resolve = require('url').resolve;

var config = require('../config');

var router = new Router();

function makeRequest(requestUrl) {
  return new Promise(function (resolve, reject) {
    request
      .get(requestUrl)
      .end(function (err, res) {
        if (err) {
          return reject(err);
        }

        resolve(res);
      });
  });
}

router.get('/', function * () {
  var requestUrl = resolve(format(config.templateUrl, config.portBase + 1), '/');
  yield makeRequest(requestUrl);
  this.body = {
    message: 'success'
  };
  this.status = 200;
});


router.get('/error', function * () {
  throw new Error('Error happened');
});

router.get('/error-dep', function * () {
  var requestUrl = resolve(format(config.templateUrl, config.portBase + 1), '/error');
  yield makeRequest(requestUrl);
  this.body = {
    message: 'success'
  };
  this.status = 200;
});

var app = koa();

app.use(router.middleware());

app.listen(process.env.PORT, function () {
  console.log('service 1 is running on port: ' + process.env.PORT);
});

