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

function decideWrap (me, original, args, agent, methodName) {
  if (methodName === 'query') {
    return utils.wrapQuery.call(me, original, args, agent, composeAgentData(me.config, args))
  } else {
    return original.apply(me, args)
  }
}

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
    url: connectionURI || undefined,
    host: config.host || 'unknown',
    method: utils.tryParseSql(args[0] || ''),
    parseError: function (err) {
      // *FIXME* mysql responsecodes != http response codes
      return err ? 400 : 200
    }
  }
}

module.exports = function (mysql, agent) {
  var _createConnection = mysql.createConnection
  var _createPool = mysql.createPool

  mysql.createConnection = function (config) {
    var Connection = _createConnection(config)

    Shimmer.wrap(Connection, 'Connection', CONNECTION_OPERATIONS, function (original, name) {
      return function () {
        var args = Array.prototype.slice.apply(arguments)
        var last = args.length - 1
        var callback = args[last]

        if (callback === 'function') {
          args[last] = agent.bind(callback)
        }
        return decideWrap(this, original, args, agent, name)
      }
    })
    return Connection
  }

  mysql.createPool = function (config) {
    var Pool = _createPool(config)

    Shimmer.wrap(Pool, 'Pool', POOL_OPERATIONS, function (original, name) {
      return function () {
        var args = Array.prototype.slice.apply(arguments)
        var last = args.length - 1
        var callback = args[last]

        if (typeof callback === 'function') {
          args[last] = agent.bind(callback)
        }
        return decideWrap(this, original, args, agent, name)
      }
    })

    return Pool
  }
  return mysql
}
