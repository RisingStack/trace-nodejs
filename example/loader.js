var async = require('async');
var http = require('http');

async.times(20, function (n, done) {

  async.parallel([
    function (cb) {
      http.get('http://localhost:3000', cb);
    },
    function (cb) {
      http.get('http://localhost:3000', cb);
    }
  ], done)

});
