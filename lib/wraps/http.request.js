var uuid = require('node-uuid');
var microtime = require('microtime');

var Collector = require('../collector');

var getNamespace = require('continuation-local-storage').getNamespace;
var session = getNamespace('seetru');

var whiteListHosts = ['localhost:8000'];
var HEADER_NAME = 'request-id';

function wrapRequest (original, collector) {

  return function (requestParams) {

    if (whiteListHosts.indexOf(requestParams.host + ':' +requestParams.port) > -1) {
      return original.apply(this, arguments);
    }

    var requestId = session.get(HEADER_NAME);
    requestId = requestId.split(':')[0] + ':' + uuid.v1();

    var collectorDataBag = {
      id: requestId,
      host: requestParams.host + ':' + requestParams.port,
      url: requestParams.path,
      time: microtime.now(),
      headers: requestParams.headers
    };

    var returned;

    // Collect request start
    process.nextTick(function () {
      collector.emit(Collector.CLIENT_SEND, collectorDataBag);
    });

    requestParams.headers = requestParams.headers || {};
    requestParams.headers[HEADER_NAME] = requestId;

    returned = original.apply(this, arguments);

    returned.on('response', function (incomingMessage) {
      var collectorDataBag = {
        id: requestId,
        host: requestParams.host + ':' + requestParams.port,
        url: requestParams.path,
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
