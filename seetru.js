var shimmer = require('./shimmer');

var http = require('http');
var url = require('url');

var uuid = require('node-uuid');

var createNamespace = require('continuation-local-storage').createNamespace;
var session = createNamespace('seetru');

var headerName = ['x-request-id'];

function wrapListener(listener) {


  return function (request ,response) {

    var headers = request.headers;

    if (headers[headerName]) {
      session.set(headerName, headers[headerName]);
    } else {
      session.set(headerName, uuid.v1());
    }

    console.log('Request id:', session.get(headerName));

    console.log('Request hit at', process.hrtime());

    function instrumentedFinish() {
      var parsedUrl = url.parse(request.originalUrl || request.url, true)
      console.log('Request finish at', process.hrtime());

    }
    response.once('finish', instrumentedFinish)

    return listener.apply(this, arguments);
  }
}

function seetru () {


  shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'], function (addListener) {
    return function (type, listener) {
      if (type === 'request' && typeof listener === 'function') {
        console.log('request');
        return addListener.call(this, type, session.bind(wrapListener(listener)));
      } else {
        return addListener.apply(this, arguments)
      }
    }
  });


  shimmer.wrap(http, 'http', 'request', function (original) {
    return function () {
      console.log("Starting request!");
      arguments[0].headers = arguments[0].headers || {};
      arguments[0].headers[headerName] = session.get(headerName);
      var returned = original.apply(this, arguments);
      console.log("Done setting up request -- OH YEAH!");
      return returned;
    };
  });


}

seetru();
