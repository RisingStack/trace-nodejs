var url = require('url');

var qs = require('qs');
var uuid = require('node-uuid');
var microtime = require('microtime');

var getNamespace = require('continuation-local-storage').getNamespace;
var session = getNamespace('seetru');

var Shimmer = require('../shimmer');

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

    function addSession () {
      session.set('request-id', requestId);

      Shimmer.wrap(process, 'process', '_fatalException', function (original) {
        return session.bind(function (stackTrace) {
          collector.onCrash({
            id: session.get('request-id'),
            time: microtime.now(),
            host: headers.host,
            url: requestUrl.pathname,
            stackTrace: stackTrace.stack
          });
          return original.apply(this, arguments);
        });
      });

      return listener.apply(this, arguments);
    }

    return session.bind(addSession).apply(this, arguments);
  };
}

module.exports = wrapListener;
