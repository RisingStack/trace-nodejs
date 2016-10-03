var flatMap = require('lodash.flatmap')

var Shimmer = require('../utils/shimmer')
var consts = require('../consts')
var utils = require('./utils')
var instrumentedCommands = require('./utils').redisTools.instrumentedCommands

module.exports = function wrap (redis, agent, pkg) {
  var _instrumentedCommands = flatMap(Object.keys(instrumentedCommands), function (key) {
    return instrumentedCommands[key]
  })

  Shimmer.wrap(redis.RedisClient.prototype,
    _instrumentedCommands.concat(['multi']), function (original, name) {
      return function () {
        var host = this.address
        var args = Array.prototype.slice.apply(arguments)

        if (name === 'multi') {
          // start a multi
          var multi = original.apply(this, args)
          multi.__trace = []
          var originalExec = multi.exec
          multi.exec = function () {
            var args = Array.prototype.slice.apply(arguments)
            var commands = this.__trace
            return utils.wrapQuery.call(this, originalExec, args, agent, {
              protocol: consts.PROTOCOLS.REDIS,
              host: host,
              method: 'multi: ' + commands.join(', '),
              url: 'unknown'
            })
          }
          return multi
        } else {
          return utils.wrapQuery.call(this, original, args, agent, {
            protocol: consts.PROTOCOLS.REDIS,
            host: host,
            method: name,
            url: 'unknown'
          })
        }
      }
    })

  Shimmer.wrap(redis.Multi.prototype, _instrumentedCommands,
    function (original, name) {
      return function () {
        var args = Array.prototype.slice.apply(arguments)
        this.__trace.push(name)
        return original.apply(this, args)
      }
    })

  return redis
}
