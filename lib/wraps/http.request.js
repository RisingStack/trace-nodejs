var Collector = require('../collector');

var debug = require('debug')('risingstack/trace');
var getNamespace = require('continuation-local-storage').getNamespace;
var microtime = require('microtime');
var url = require('url');
var uuid = require('node-uuid');

var whiteListHosts = [
  'localhost:8000'
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

    debug('trace id:', requestId);

    var clientSendTime = microtime.now();

    requestParams.headers = requestParams.headers || {};

    if (requestId) {
      requestParams.headers['request-id'] = requestId;
    }

    if (typeof collector.getService() !== 'undefined') {
      requestParams.headers['x-parent'] = collector.getService();
    }

    requestParams.headers['x-client-send'] = clientSendTime;

    requestParams.headers['x-span-id'] = uuid.v1();

    var collectorDataBag = {
      id: requestId,
      host: requestParams.host + ':' + requestParams.port,
      url: requestParams.pathname,
      time:  clientSendTime,
      headers: requestParams.headers
    };

    // Collect request start
    process.nextTick(function () {
      collector.emit(Collector.CLIENT_SEND, collectorDataBag);
    });

    /*
     *  CLIENT_RECV
     */
    var returned;
    returned = original.apply(this, arguments);

    returned.on('error', function (err) {
      var collectorDataBag = {
        id: requestId,
        host: requestParams.host + ':' + requestParams.port,
        url: requestParams.pathname,
        time: microtime.now(),
        headers: requestParams.headers,
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
