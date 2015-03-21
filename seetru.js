var shimmer = require('./shimmer');

var http = require('http');
var url = require('url');

var uuid = require('node-uuid');

var createNamespace = require('continuation-local-storage').createNamespace;
var session = createNamespace('seetru');

var HEADER_NAME = ['x-request-id'];

var RequestCollector = require('./RequestCollector');

/*
 * @method wrapListener
 * @param {Function} listener
 * @returns {Function} listener
 */
function wrapListener(listener, requestCollector) {
  return function (request, response) {
    var headers = request.headers;    
    var requestId = headers[HEADER_NAME] || uuid.v1();

    session.set(HEADER_NAME, requestId);

    // Collect request start
    requestCollector.emit(RequestCollector.REQUEST_STARTED, {
      id: requestId,
      url: request.originalUrl || request.url,
      time: process.hrtime()
    });

    function instrumentedFinish() {

      // Collect request ended
      requestCollector.emit(RequestCollector.REQUEST_ENDED, {
        id: session.get(HEADER_NAME),
        url: request.originalUrl || request.url,
        time: process.hrtime()
      });
    }

    response.once('finish', instrumentedFinish);

    return listener.apply(this, arguments);
  };
}

function seetru () {
  var requestCollector = new RequestCollector();

  shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'], function (addListener) {
    return function (type, listener) {
      if (type === 'request' && typeof listener === 'function') {
        console.log('request');
        return addListener.call(this, type, session.bind(wrapListener(listener, requestCollector)));
      } else {
        return addListener.apply(this, arguments);
      }
    };
  });

  shimmer.wrap(http, 'http', 'request', function (original) {
    return function () {
      console.log('Starting request!');
      arguments[0].headers = arguments[0].headers || {};
      arguments[0].headers[HEADER_NAME] = session.get(HEADER_NAME);
      var returned = original.apply(this, arguments);
      console.log('Done setting up request -- OH YEAH!');
      return returned;
    };
  });
}

seetru();
