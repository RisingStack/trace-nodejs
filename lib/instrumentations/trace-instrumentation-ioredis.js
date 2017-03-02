'use strict'
var Shimmer = require('../utils/shimmer')
var instrumentedCommands = require('./utils').redisTools.instrumentedCommands
var consts = require('../consts')
var flatMap = require('lodash.flatmap')
var utils = require('./utils')

function concatHost (options) {
  var res = ''
  if (options && options.host) {
    res += options.host
    if (options.port) {
      res += ':' + options.port
    }
  }
  return res
}

module.exports = function wrap (redis, agent) {
  var _instrumentedCommands = flatMap(Object.keys(instrumentedCommands), function (key) {
    return instrumentedCommands[key]
  })
  Shimmer.wrap(redis.prototype, _instrumentedCommands, function (original, name) {
    return function () {
      var host = concatHost(this.options)
      var args = Array.prototype.slice.apply(arguments)

      return utils.wrapQuery.call(this, original, args, agent, {
        continuationMethod: typeof args[args.length - 1] !== 'function' ? 'promise' : 'callback',
        protocol: consts.PROTOCOLS.REDIS,
        host: host || 'unknown',
        method: name,
        url: 'unknown'
      })
    }
  })
  return redis
}
