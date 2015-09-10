var debug = require('debug')('risingstack/trace');
var session = require('continuation-local-storage').createNamespace('trace');

var Collector = require('./collector');
var getConfig = require('./utils/configReader').getConfig;
var wraps = require('./wraps');

var traceAgent;

var config = getConfig();

var collector = new Collector(config);

wraps.instrument(collector, config);

function setService(config, callback) {
  var reporter = config.reporter;

  if (!reporter.getService) {
    return callback(null, {
      key: config.appName
    });
  }

  reporter.getService(callback);
}

/*
 * @method trace
 */
function trace() {
  setService(config, function (err, service) {
    if (err) {
      return console.error(err);
    }

    debug('service id: ', service);
    collector.setService(service.key);

    debug('starting collector');
    collector.startCollecting();
  });

  return {
    report: function (data) {
      debug('trace.report', data);

      collector.report(data);
    },
    getTransactionId: function () {
      var transactionId = session.get('request-id');

      debug('trace.getTransactionId', transactionId);

      return transactionId;
    }
  };
}

traceAgent = trace();

module.exports = traceAgent;

