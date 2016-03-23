var Shimmer = require('../utils/shimmer')
var consts = require('../consts')

module.exports = function wrap (redis, agent) {
  Shimmer.wrap(redis.prototype, 'redis.prototype', 'sendCommand', function (original) {
    return function () {
      var spanId = agent.generateSpanId()
      var clientSendTime = agent.getMicrotime()
      var requestId = agent.getTransactionId()

      var host = function () {
        var res = ''
        if (this.options && this.options.host) {
          res += this.options.host
          if (this.options.port) {
            res += ':' + this.options.port
          }
        }
        return res
      }.call(this)

      var args = Array.prototype.slice.apply(arguments)
      var command = args[0].name

      agent.clientSend({
        id: requestId,
        spanId: spanId,
        host: host,
        time: clientSendTime,
        method: command,
        type: agent.CLIENT_SEND,
        url: ''
      })

      var originalPromise = original.apply(this, args)

      var report = function (err) {
        agent.clientReceive({
          id: requestId,
          spanId: spanId,
          host: host,
          time: clientSendTime,
          url: '', // TODO(c/KRU7H3D1): add support for url parameter with redis key
          method: command,
          mustCollect: err ? consts.MUST_COLLECT.ERROR : undefined,
          responseTime: agent.getMicrotime() - clientSendTime,
          status: err ? consts.EDGE_STATUS.NOT_OK : consts.EDGE_STATUS.OK,
          statusCode: err ? err.code : 200
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
