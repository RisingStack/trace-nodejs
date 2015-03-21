var shimmer = require('./shimmer');

var http = require('http');
var url = require('url');

var uuid = require('node-uuid');

var createNamespace = require('continuation-local-storage').createNamespace;
var session = createNamespace('seetru');

var HEADER_NAME = 'x-request-id';

var IncomingCollector = require('./IncomingCollector');
var OutgoingCollector = require('./OutgoingCollector');

/*
 * @method wrapListener
 * @param {Function} listener
 * @returns {Function} listener
 */
function wrapListener(listener, incomingCollector) {
  return function (request, response) {
    var headers = request.headers;
    var requestId = headers[HEADER_NAME] || uuid.v1();

    session.set(HEADER_NAME, requestId);

    // Collect request start
    incomingCollector.emit(IncomingCollector.REQUEST_STARTED, {
      id: requestId,
      host: headers.host,
      url: request.originalUrl || request.url,
      time: process.hrtime()
    });

    function instrumentedFinish() {
      var requestId = session.get(HEADER_NAME);

      // Collect request ended
      incomingCollector.emit(IncomingCollector.REQUEST_ENDED, {
        id: requestId,
        host: headers.host,
        url: request.originalUrl || request.url,
        time: process.hrtime()
      });
    }

    response.once('finish', instrumentedFinish);

    return listener.apply(this, arguments);
  };
}

function seetru () {
  var incomingCollector = new IncomingCollector();
  var outgoingCollector = new OutgoingCollector();

  shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'], function (addListener) {
    return function (type, listener) {
      if (type === 'request' && typeof listener === 'function') {
        return addListener.call(this, type, session.bind(wrapListener(listener, incomingCollector)));
      } else {
        return addListener.apply(this, arguments);
      }
    };
  });

  shimmer.wrap(http, 'http', 'request', function (original) {
    return function (requestParams) {
      var requestId = session.get(HEADER_NAME);

      // Collect request start
      outgoingCollector.emit(OutgoingCollector.REQUEST_STARTED, {
        id: requestId,
        host: requestParams.host + ':' + requestParams.port,
        url: requestParams.path,
        time: process.hrtime()
      });

      requestParams.headers = requestParams.headers || {};
      requestParams.headers[HEADER_NAME] = requestId;
      var returned = original.apply(this, arguments);
      return returned;
    };
  });
}

seetru();
