var shimmer = require('./shimmer');

var http = require('http');
var url = require('url');

function wrapListener(listener) {

  return function (request ,response) {

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
        return addListener.call(this, type, wrapListener(listener))
      } else {
        return addListener.apply(this, arguments)
      }
    }
  });
}

seetru();
