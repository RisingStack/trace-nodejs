'use strict'
var Shimmer = require('../utils/shimmer')
var consts = require('../consts')
var utils = require('./utils')
var semver = require('semver')

var COLLECTION_OPERATIONS = [
  'aggregate',
  'count',
  'deleteMany',
  'deleteOne',
  'distinct',
  'find',
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

function wrapper (mongodb, agent, pkg) {
  Shimmer.wrap(mongodb.Collection.prototype, COLLECTION_OPERATIONS, function (original, name) {
    return function () {
      var self = this
      var args = Array.prototype.slice.apply(arguments)
      var host
      var continuationMethod
      var queryOptions = typeof args[args.length - 1] === 'function' ? args[args.length - 2] : args[args.length - 1]
      var version = pkg ? pkg.version : undefined

      if (this.db && this.db.serverConfig) {
        host = this.db.serverConfig.host + ':' + this.db.serverConfig.port
      } else if (this.s && this.s.topology && this.s.topology.host) {
        host = this.s.topology.host + ':' + this.s.topology.port
      } else if (this.s && this.s.topology && this.s.topology.isMasterDoc) {
        host = this.s.topology.isMasterDoc.primary
      }

      if (name === 'aggregate') {
        if (version && semver.satisfies(version, '>= 2.0.0')) {
          // above 2.0.0 if no callback is provided a cursor is returned
          continuationMethod = typeof args[args.length - 1] === 'function' ? 'callback' : 'eventEmitter'
        } else {
          // below 2.0.0 if a cursor description is provided, a cursor is returned, otherwise callback is called
          continuationMethod = queryOptions.cursor ? null : 'callback'
        }
      } else if (typeof args[args.length - 1] === 'function') {
        continuationMethod = 'callback'
      } else if (name === 'find') {
        continuationMethod = version && semver.satisfies(version, '>= 2.0.0') ? 'eventEmitter' : null
      } else if (version && semver.satisfies(version, '>= 2.0.0')) {
        continuationMethod = 'promise'
      } else {
        continuationMethod = 'callback'
      }

      return utils.wrapQuery.call(this, original, args, agent, {
        protocol: consts.PROTOCOLS.MONGODB,
        url: self.collectionName || 'unknown',
        host: host || 'unknown',
        method: name,
        continuationMethod: continuationMethod
      })
    }
  })

  return mongodb
}

module.exports = {
  package: true,
  instrumentations: [{
    path: 'mongodb',
    post: wrapper
  }],
  _COLLECTION_OPERATIONS: COLLECTION_OPERATIONS
}
