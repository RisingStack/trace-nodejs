var Shimmer = require('../utils/shimmer')

module.exports = function (mysql, agent) {
  var _createConnection = mysql.createConnection
  var _createPool = mysql.createPool

  mysql.createConnection = function (config) {
    var Connection = _createConnection(config)

    Shimmer.wrap(Connection, 'Connection', [
      'connect',
      'query'
    ], function (original) {
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

    Shimmer.wrap(Pool, 'Pool', [
      'getConnection'
    ], function (original) {
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
