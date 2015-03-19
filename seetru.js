var shimmer = require('./shimmer');

var http = require('http');

function seetru () {

  shimmer.wrap(http, 'request', function (original) {
    return function () {
      console.log("Starting request!");
      console.log(arguments[0]);
      var returned = original.apply(this, arguments)
      console.log("Done setting up request -- OH YEAH!");
      return returned;
    };
  });
}

seetru();
