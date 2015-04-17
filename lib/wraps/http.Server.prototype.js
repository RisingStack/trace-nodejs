var url = require('url');

var qs = require('qs');
var uuid = require('node-uuid');
var microtime = require('microtime');

var getNamespace = require('continuation-local-storage').getNamespace;
var session = getNamespace('seetru');

var Collector = require('../collector');

function wrapListener(listener, collector) {
  return function (request, response) {
    var headers = request.headers;

    var requestQuery = qs.parse(url.parse(request.url).query).requestId;
    var requestUrl = url.parse(request.url);
    var requestId = headers['request-id'] || requestQuery;
    var seetruData = headers['x-seetru'];

    if (!requestId) {
      requestId = uuid.v1();
    }

    var collectorDataBag = {
      id: requestId,
      host: headers.host,
      url: requestUrl.pathname,
      time: microtime.now(),
      seetruData: seetruData
    };

    // Set tracking header
    session.set('request-id', requestId);

    // Collect request start
    process.nextTick(function () {
      collector.emit(Collector.SERVER_RECV, collectorDataBag);
    });

    /*
     * @method instrumentedFinish
     */
    function instrumentedFinish () {

      var collectorDataBag = {
        id: requestId,
        host: headers.host,
        url: requestUrl.pathname,
        time: microtime.now(),
        statusCode: response.statusCode
      };

      // Collect request ended
      process.nextTick(function () {
        collector.emit(Collector.SERVER_SEND, collectorDataBag);
      });
    }

    response.once('finish', instrumentedFinish);

    return listener.apply(this, arguments);
  };
}

module.exports = wrapListener;
