var getNamespace = require('continuation-local-storage').getNamespace;
var microtime = require('microtime');

function wrapRequest (original, collector) {
  var session = getNamespace('trace');

  return session.bind(function (stackTrace) {
    collector.onCrash({
      id: session.get('request-id'),
      time: microtime.now(),
      stackTrace: stackTrace.stack
    });
    return original.apply(this, arguments);
  });
}

module.exports = wrapRequest;
