var http = require('http');

var Collector = require('./collector');
var Shimmer = require('./Shimmer');

var COLLECT_INTERVAL = 120 * 1000;
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

  return {
    report: function (data) {
      collector.report(data);
    }
  };
}

module.exports = seetru;
