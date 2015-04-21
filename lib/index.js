var http = require('http');
var fs = require('fs');
var path = require('path');

var createNamespace = require('continuation-local-storage').createNamespace;
var session = createNamespace('seetru');

var microtime = require('microtime');

var Collector = require('./collector');
var Shimmer = require('./Shimmer');

var HEADER_NAME = 'request-id';
var COLLECT_INTERVAL = 3 * 1000;
var SAMPLE_SIZE = 60;

/*
 * @method seetru
 */
function seetru(options) {

  options.collectInterval = COLLECT_INTERVAL;
  options.sampleSize = SAMPLE_SIZE;

  var collector = new Collector(options);
  collector.startCollecting();

  Shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./wraps/http.Server.prototype.js')(listener,
              collector, options));
        } else {
          return addListener.apply(this, arguments);
        }
      };
    });

  Shimmer.wrap(http, 'http', 'request', function (original) {
    return require('./wraps/http.request')(original, collector, options);
  });

  process._fatalException = function (a) {
    console.log(a);

    console.log(JSON.stringify(process.__seetru))

    return;
    console.log('traceId', traceId)

    var trace = collector.store[traceId];

    trace.trace = traceId;
    trace.service = collector.service;
    trace.stackTrace = err.stack;

    trace.events.push({
      time: microtime.now(),
      type: 'st'
    });

    console.log(__dirname, '../seetru.log')

    fs.writeFileSync(path.join(__dirname, '../seetru.log'), JSON.stringify(
      trace
    ) + '\n', {flag: 'a'});
  };

  return {
    report: function (data) {
      collector.report(data);
    }
  };
}

module.exports = seetru;
