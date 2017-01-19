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
        var config = moduleName === 'pool'
          ? this.config.connectionConfig
          : this.config

        var connectionURI
        if (!!config.user && !!config.host && !!config.port && !!config.database) {
          connectionURI = 'mysql://' + (config.user || 'unknown') + '@' +
                                       (config.host || 'unknown') + ':' +
                                       (config.port || 'unknown') + '/' +
                                       (config.database || 'unknown')
        }

        return utils.wrapQuery.call(this,
          original,
          args,
          agent, {
            continuationMethod: typeof callback === 'function' ? 'callback' : null,
            protocol: consts.PROTOCOLS.MYSQL,
            url: connectionURI || 'unknown',
            host: config.host || 'unknown',
            method: utils.tryParseSql(args[0]) || 'unknown'
          })
      } else {
        return original.apply(this, args)
      }
    }
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
