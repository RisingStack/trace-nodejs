var Shimmer = require('../utils/shimmer')
var consts = require('../consts')
var utils = require('./utils')

var COLLECTION_OPERATIONS = [
  'aggregate',
  'count',
  'deleteMany',
  'deleteOne',
  'distinct',
  'findAndModify',
  'findAndRemove',
  'findOne',
  'findOneAndDelete',
  'findOneAndReplace',
  'findOneAndUpdate',
  'geoHaystackSearch',
  'geoNear',
  'group',
  'insert',
  'insertMany',
  'insertOne',
  'mapReduce',
  'remove',
  'save',
  'update',
  'updateMany',
  'updateOne'
]

module.exports = function (mongodb, agent) {
  Shimmer.wrap(mongodb.Collection.prototype, COLLECTION_OPERATIONS, function (original, name) {
    return function () {
      var _this = this
      var args = Array.prototype.slice.apply(arguments)
      var host

      if (this.db && this.db.serverConfig) {
        host = this.db.serverConfig.host + ':' + this.db.serverConfig.port
      } else if (this.s && this.s.topology && this.s.topology.host) {
        host = this.s.topology.host + ':' + this.s.topology.port
      } else if (this.s && this.s.topology && this.s.topology.isMasterDoc) {
        host = this.s.topology.isMasterDoc.primary
      }

      return utils.wrapQuery.call(this, original, args, agent, {
        protocol: consts.PROTOCOLS.MONGODB,
        url: _this.collectionName || 'unknown',
        host: host,
        method: name,
        disableCallback: name === 'aggregate'
      })
    }
  })

  return mongodb
}

module.exports._COLLECTION_OPERATIONS = COLLECTION_OPERATIONS
