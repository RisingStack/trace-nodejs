var url = require('url');

var qs = require('qs');
var uuid = require('node-uuid');
var microtime = require('microtime');
var _ = require('lodash');

var getNamespace = require('continuation-local-storage').getNamespace;
var session = getNamespace('seetru');

var Collector = require('../collector');

var HEADER_NAME = 'request-id';

function wrapListener(listener, collector, blackListHosts) {
  return function (request, response) {

    var searchResult = _.find(blackListHosts, function (host) {
      return request.url.indexOf(host) > -1;
    });

    if (searchResult) {
      return listener.apply(this, arguments);
    }

    var headers = request.headers;
    var requestQuery = qs.parse(url.parse(request.url).query).requestId;

    var requestId = headers[HEADER_NAME] || requestQuery;

    if (!requestId) {
      requestId = uuid.v1() + ':' + uuid.v1();
    }

    var collectorDataBag = {
      id: requestId,
      host: headers.host,
      url: request.originalUrl || request.url,
      time: microtime.now(),
      headers: request.headers
    };

    // Set tracking header
    session.set(HEADER_NAME, requestId);

    // Collect request start
    process.nextTick(function () {
      collector.emit(Collector.SERVER_RECV, collectorDataBag);
    });

    /*
     * @method instrumentedFinish
     */
    function instrumentedFinish() {

      var requestId = session.get(HEADER_NAME);
      var collectorDataBag = {
        id: requestId,
        host: headers.host,
        url: request.originalUrl || request.url,
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
