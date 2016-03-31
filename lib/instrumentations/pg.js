var Shimmer = require('../utils/shimmer')
var consts = require('../consts')

module.exports = function wrap (pg, agent) {
  Shimmer.wrap(pg.Client.prototype, 'pg.Client.prototype', 'query', function (original) {
    return function () {
      console.log('called')
      var spanId = agent.generateSpanId()
      var clientSendTime = agent.getMicrotime()
      var requestId = agent.getTransactionId()

      var host = this.host
      var url = this.database

      var args = Array.prototype.slice.apply(arguments)
      var command = args[0] // TODO: parse SQL
      var last = args[args.length - 1]

      var wrappedCallback = function (original) {
        return function (err) {
          agent.clientReceive({
            protocol: consts.PROTOCOLS.POSTGRES,
            id: requestId,
            spanId: spanId,
            host: host,
            time: clientSendTime,
            url: url,
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
        url: url
      })

      return original.apply(this, args)
    }
  })

  return pg
}
