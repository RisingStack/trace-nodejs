var async = require('async');
var http = require('http');

async.times(5, function (n, done) {

  async.parallel([
    function (cb) {
      http.get('http://localhost:3000', cb);
    }
  ], done)

});
