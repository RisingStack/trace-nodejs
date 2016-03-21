var Shimmer = require('../utils/shimmer')
var consts = require('../consts')

var COLLECTION_OPERATIONS = [
  'find',
  'findOne'
]

module.exports = function (mongodb, agent) {
  Shimmer.wrap(mongodb.Collection.prototype, 'mongodb.Collection.prototype', COLLECTION_OPERATIONS, function (original, name) {
    return function () {
      var _this = this
      var args = Array.prototype.slice.apply(arguments)
      var originalCallback = args.pop()
      var spanId = agent.generateSpanId()
      var clientSendTime = agent.getMicrotime()
      var requestId = agent.getTransactionId()
      var host

      if (this.db && this.db.serverConfig) {
        host = this.db.serverConfig.host + ':' + this.db.serverConfig.port
      } else if (this.s && this.s.topology && this.s.topology.isMasterDoc) {
        host = this.s.topology.isMasterDoc.primary
      }

      var wrapped = function (err) {
        agent.clientReceive({
          id: requestId,
          spanId: spanId,
          protocol: consts.PROTOCOLS.MONGODB,
          host: host,
          url: _this.collectionName || 'unknown',
          method: name,
          mustCollect: err ? consts.MUST_COLLECT.ERROR : undefined,
          responseTime: agent.getMicrotime() - clientSendTime,
          status: err ? consts.EDGE_STATUS.NOT_OK : consts.EDGE_STATUS.OK,
          statusCode: err ? err.code : 200
        })
        return originalCallback.apply(this, arguments)
      }

      if (originalCallback && typeof originalCallback === 'function') {
        args.push(wrapped)
      } else {
        args.push(originalCallback)
      }

      agent.clientSend({
        id: requestId,
        spanId: spanId,
        host: host,
        time: clientSendTime,
        method: name,
        url: this.collectionName || 'unknown',
        type: agent.CLIENT_SEND
      })

      return original.apply(this, args)
    }
  })

  return mongodb
}
