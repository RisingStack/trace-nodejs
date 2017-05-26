'use strict'
var Shimmer = require('../utils/shimmer')
var consts = require('../consts')
var utils = require('./utils')

var CONNECTION_OPERATIONS = [
  'connect',
  'query',
  'end'
]

var POOL_OPERATIONS = [
  'getConnection',
  'query',
  'destroy'
]

module.exports = function (mysql, agent, pkg) {
  function wrapOperations (moduleName, original, name) {
    return function () {
      var args = Array.prototype.slice.apply(arguments)
      var last = args.length - 1
      var callback = args[last]

      if (name === 'query') {
        wrapQuery.call(this, moduleName, original, args, callback)
      } else if (name === 'getConnection') {
        wrapGetConnection.call(this, original, callback)
      } else {
        return original.apply(this, args)
      }
    }
  }

  function wrapQuery (moduleName, original, args, callback) {
    var config = moduleName === 'pool'
      ? this.config.connectionConfig
      : this.config

    var user = config.user || 'unknown'
    var host = config.host || 'unknown'
    var port = config.port ? ':' + config.port : ''
    var database = config.database ? '/' + config.database : ''

    var connectionURI = 'mysql://' +
      user + '@' +
      host +
      port +
      database

    var hostString = host +
      port +
      database

    return utils.wrapQuery.call(this,
      original,
      args,
      agent, {
        continuationMethod: typeof callback === 'function' ? 'callback' : 'eventEmitter',
        protocol: consts.PROTOCOLS.MYSQL,
        url: connectionURI,
        host: hostString,
        method: utils.tryParseSql(args[0]) || 'unknown'
      })
  }

  function wrapGetConnection (original, callback) {
    var wrappedCallback = function (err, connection) {
      Shimmer.wrap(connection, CONNECTION_OPERATIONS, wrapOperations.bind(this, 'connection'))
      return callback.call(this, err, connection)
    }
    return original.call(this, wrappedCallback)
  }

  Shimmer.wrap(mysql, 'createConnection', function (original) {
    return function () {
      var args = Array.prototype.slice.apply(arguments)
      var connection = original.apply(this, args)
      Shimmer.wrap(connection, CONNECTION_OPERATIONS, wrapOperations.bind(this, 'connection'))
      return connection
    }
  })

  Shimmer.wrap(mysql, 'createPool', function (original) {
    return function () {
      var args = Array.prototype.slice.apply(arguments)
      var pool = original.apply(this, args)
      Shimmer.wrap(pool, POOL_OPERATIONS, wrapOperations.bind(this, 'pool'))
      return pool
    }
  })

  return mysql
}
