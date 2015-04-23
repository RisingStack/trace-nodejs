var microtime = require('microtime');

var Collector = require('../collector');

var getNamespace = require('continuation-local-storage').getNamespace;

var whiteListHosts = ['localhost:8000'];

function wrapRequest (original, collector, options) {

  return function (requestParams) {

    if (whiteListHosts.indexOf(requestParams.host + ':' + requestParams.port) > -1) {
      return original.apply(this, arguments);
    }
    var session = getNamespace('seetru');
    var requestId = session.get('request-id');

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

    requestParams.headers['x-seetru'] = clientSendTime + '-' + options.service;

    returned = original.apply(this, arguments);

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
