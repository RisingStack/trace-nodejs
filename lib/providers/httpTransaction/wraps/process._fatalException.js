var getNamespace = require('continuation-local-storage').getNamespace
var microtime = require('microtime')

function wrap (original, collector) {
  var session = getNamespace('trace')

  return function (stackTrace) {
    collector.onCrash({
      id: session.get('request-id'),
      spanId: session.get('span-id'),
      time: microtime.now(),
      stackTrace: stackTrace
    })

    return original.apply(this, arguments)
  }
}

module.exports = wrap
