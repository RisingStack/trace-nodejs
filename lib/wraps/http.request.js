var Collector = require('../collector');

var debug = require('debug')('trace-wraps-http-request');
var getNamespace = require('continuation-local-storage').getNamespace;
var microtime = require('microtime');
var url = require('url');

var whiteListHosts = [
  'localhost:8000',
  'seetru-collector-staging.herokuapp.com:80'
];

function wrapRequest (original, collector) {

  return function (requestParams) {

    if (typeof requestParams === 'string') {
      requestParams = url.parse(requestParams);
      requestParams.method = 'GET';
    }

    if (requestParams.hostname) {
      requestParams.host = requestParams.hostname;
    }

    if (whiteListHosts.indexOf(requestParams.host + ':' + requestParams.port) > -1) {
      return original.apply(this, arguments);
    }

    var session = getNamespace('trace');
    var requestId = session.get('request-id');

    debug('Trace id:', requestId);

    var clientSendTime = microtime.now();

    var collectorDataBag = {
      id: requestId,
      host: requestParams.host + ':' + requestParams.port,
      url: requestParams.pathname,
      time: clientSendTime,
      headers: requestParams.headers
    };

    var returned;

    // Collect request start
    process.nextTick(function () {
      collector.emit(Collector.CLIENT_SEND, collectorDataBag);
    });

    requestParams.headers = requestParams.headers || {};

    if (requestId) {
      requestParams.headers['request-id'] = requestId;
    }

    // HACK why?
    if (typeof collector.getService() !== 'undefined') {
      requestParams.headers['x-trace'] = clientSendTime + '-' + collector.getService();
    }

    returned = original.apply(this, arguments);
    session.bindEmitter(returned);

    returned.on('error', function (err) {
      var collectorDataBag = {
        id: requestId,
        host: requestParams.host + ':' + requestParams.port,
        url: requestParams.pathname,
        time: microtime.now(),
        err: err
      };

      collector.emit(Collector.CLIENT_RECV, collectorDataBag);
    });

    returned.on('response', function (incomingMessage) {
      var collectorDataBag = {
        id: requestId,
        host: requestParams.host + ':' + requestParams.port,
        url: requestParams.pathname,
        time: microtime.now(),
        headers: incomingMessage.headers,
        statusCode: incomingMessage.statusCode
      };
      collector.emit(Collector.CLIENT_RECV, collectorDataBag);
    });

    return returned;
  };
}

module.exports = wrapRequest;
