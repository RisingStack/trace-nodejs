var Shimmer = require('../utils/shimmer')
var consts = require('../consts')

module.exports = function wrap (redis, agent) {
  Shimmer.wrap(redis.RedisClient.prototype, 'redis.RedisClient.prototype', 'send_command', function (original) {
    return function () {
      var spanId = agent.generateSpanId()
      var clientSendTime = agent.getMicrotime()
      var requestId = agent.getTransactionId()

      var host = this.address

      var args = Array.prototype.slice.apply(arguments)
      var command = args[0]
      var last = args[args.length - 1]

      var wrappedCallback = function (original) {
        return function (err) {
          agent.clientReceive({
            protocol: consts.PROTOCOLS.REDIS,
            id: requestId,
            spanId: spanId,
            host: host,
            time: clientSendTime,
            url: 'unknown', // TODO(c/KRU7H3D1): add support for url parameter with redis key
            method: command,
            mustCollect: err ? consts.MUST_COLLECT.ERROR : undefined,
            responseTime: agent.getMicrotime() - clientSendTime,
            status: err ? consts.EDGE_STATUS.NOT_OK : consts.EDGE_STATUS.OK,
            statusCode: err ? err.code : 200
          })
          return original.apply(this, arguments)
        }
      }

      if (last && typeof last === 'function') {
        args[args.length - 1] = wrappedCallback(last)
      } else if (Array.isArray(last) && typeof last[last.length - 1] === 'function') {
        last[last.length - 1] = wrappedCallback(last[last.length - 1])
      } else {
        args.push(wrappedCallback(function () { }))
      }

      agent.clientSend({
        id: requestId,
        spanId: spanId,
        host: host,
        time: clientSendTime,
        method: command,
        type: agent.CLIENT_SEND,
        url: 'unknown'
      })

      return original.apply(this, args)
    }
  })

  return redis
}
