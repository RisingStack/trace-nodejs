var Shimmer = require('../utils/shimmer')
var consts = require('../consts')

function concatHost (options) {
  var res = ''
  if (options && options.host) {
    res += options.host
    if (options.port) {
      res += ':' + options.port
    }
  }
  return res
}

module.exports = function wrap (redis, agent) {
  Shimmer.wrap(redis.prototype, 'redis.prototype', 'sendCommand', function (original) {
    return function () {
      var spanId = agent.generateSpanId()
      var clientSendTime = agent.getMicrotime()
      var requestId = agent.getTransactionId()

      var host = concatHost(this.options)

      var args = Array.prototype.slice.apply(arguments)
      var command = args[0].name

      agent.clientSend({
        id: requestId,
        spanId: spanId,
        host: host,
        time: clientSendTime,
        method: command,
        type: agent.CLIENT_SEND,
        url: 'unknown'
      })

      var originalPromise = original.apply(this, args)

      var report = function (err) {
        agent.clientReceive({
          id: requestId,
          spanId: spanId,
          host: host,
          time: clientSendTime,
          url: 'unknown', // TODO(c/KRU7H3D1): add support for url parameter with redis key
          method: command,
          mustCollect: err ? consts.MUST_COLLECT.ERROR : undefined,
          responseTime: agent.getMicrotime() - clientSendTime,
          status: err ? consts.EDGE_STATUS.NOT_OK : consts.EDGE_STATUS.OK,
          statusCode: err ? err.code : 200,
          protocol: consts.PROTOCOLS.REDIS
        })
      }
      return originalPromise.then(
        function (v) { report(); return v },
        function (err) { report(err); return err }
      )
    }
  })
  return redis
}
