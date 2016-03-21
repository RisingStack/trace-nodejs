var Shimmer = require('../utils/shimmer')

var CONNECTION_OPERATIONS = [
  'connect',
  'query'
]

var POOL_OPERATIONS = [
  'getConnection'
]

module.exports = function (mysql, agent) {
  var _createConnection = mysql.createConnection
  var _createPool = mysql.createPool

  mysql.createConnection = function (config) {
    var Connection = _createConnection(config)

    Shimmer.wrap(Connection, 'Connection', CONNECTION_OPERATIONS, function (original) {
      return function () {
        var args = Array.prototype.slice.apply(arguments)
        var last = args.length - 1
        var callback = args[last]

        if (typeof callback === 'function') {
          args[last] = agent.bind(callback)
        }

        return original.apply(this, args)
      }
    })

    return Connection
  }

  mysql.createPool = function (config) {
    var Pool = _createPool(config)

    Shimmer.wrap(Pool, 'Pool', POOL_OPERATIONS, function (original) {
      return function () {
        var args = Array.prototype.slice.apply(arguments)
        var last = args.length - 1
        var callback = args[last]

        if (typeof callback === 'function') {
          args[last] = agent.bind(callback)
        }

        return original.apply(this, args)
      }
    })

    return Pool
  }

  return mysql
}
