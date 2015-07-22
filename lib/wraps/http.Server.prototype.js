var url = require('url');

var qs = require('qs');
var uuid = require('node-uuid');
var microtime = require('microtime');

var getNamespace = require('continuation-local-storage').getNamespace;

var Collector = require('../collector');

function wrapListener(listener, collector) {

  return function (request, response) {
    var headers = request.headers;

    var requestUrl = url.parse(request.url);
    var requestQuery = qs.parse(requestUrl.query).requestId;
    var originalWriteHead = response.writeHead;

    var requestId = headers['request-id'] || requestQuery;

    if (!requestId) {
      requestId = uuid.v1();
    }

    var collectorDataBag = {
      id: requestId,
      host: headers.host,
      url: requestUrl.pathname,
      time: microtime.now(),
      headers: headers
    };

    var session = getNamespace('trace');

    // Collect request start
    process.nextTick(function () {
      collector.emit(Collector.SERVER_RECV, collectorDataBag);
    });

    var serverSendTime;
    /*
     * @method instrumentedFinish
     */
    function instrumentedFinish () {

      var collectorDataBag = {
        id: requestId,
        host: headers.host,
        url: requestUrl.pathname,
        time: serverSendTime,
        headers: headers,
        statusCode: response.statusCode
      };

      // Collect request ended
      process.nextTick(function () {
        collector.emit(Collector.SERVER_SEND, collectorDataBag);
      });
    }

    response.once('finish', instrumentedFinish);

    response.writeHead = function () {
      serverSendTime = microtime.now();

      response.setHeader('x-parent', collector.getService());
      response.setHeader('x-client-send', serverSendTime);

      var spanId = headers['x-span-id'];
      if (spanId) {
        response.setHeader('x-span-id', spanId);
      }

      originalWriteHead.apply(response, arguments);
    };

    function addSession () {
      session.bindEmitter(response);
      session.bindEmitter(request);
      session.set('request-id', requestId);

      return listener.apply(this, arguments);
    }

    return session.bind(addSession).apply(this, arguments);
  };
}

module.exports = wrapListener;
