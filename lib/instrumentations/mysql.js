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

function composeAgentData (config, args) {
  var connectionURI
  if (!!config.user && !!config.host && !!config.port && !!config.database) {
    connectionURI = 'mysql://' + (config.user || 'unknown') + '@' +
                                 (config.host || 'unknown') + ':' +
                                 (config.port || 'unknown') + '/' +
                                 (config.database || 'unknown')
  }
  return {
    protocol: consts.PROTOCOLS.MYSQL,
    url: connectionURI || 'unknown',
    host: config.host || 'unknown',
    method: utils.tryParseSql(args[0]) || 'unknown'
  }
}

module.exports = function (mysql, agent, pkg) {
  function wrapOperations (moduleName, original, name) {
    return function () {
      var args = Array.prototype.slice.apply(arguments)
      var last = args.length - 1
      var callback = args[last]

      if (callback === 'function') {
        args[last] = agent.storage.bind(callback)
      }
      if (name === 'query') {
        return utils.wrapQuery.call(this,
          original,
          args,
          agent,
          composeAgentData(
            moduleName === 'pool'
              ? this.config.connectionConfig
              : this.config,
            args))
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
