'use strict'
var flatMap = require('lodash.flatmap')

var Shimmer = require('../utils/shimmer')
var consts = require('../consts')
var utils = require('./utils')
var Module = require('module')
var redisCommands = require('./utils').redisTools.instrumentedCommands

var instrumentedCommands = flatMap(Object.keys(redisCommands), function (key) {
  return redisCommands[key]
})

function wrapRedisClient (redis, agent, pkg) {
  Shimmer.wrap(redis.RedisClient.prototype, instrumentedCommands, function (original, name) {
    return function () {
      var host = this.address
      var args = Array.prototype.slice.apply(arguments)
      return utils.wrapQuery.call(this, original, args, agent, {
        continuationMethod: 'callback',
        protocol: consts.PROTOCOLS.REDIS,
        host: host || 'unknown',
        method: name,
        url: 'unknown'
      })
    }
  })
  return redis
}

function wrapMulti (Multi, agent, pkg) {
  Shimmer.wrap(Multi.prototype, ['exec', 'EXEC', 'exec_transaction'], function (original, name) {
    return function () {
      var args = Array.prototype.slice.apply(arguments)
      var host = this._client && this._client.address
      var commands = this.__trace || []
      var methodString
      if (commands.length) {
        methodString = 'multi: ' + commands.join(', ')
      } else {
        methodString = 'multi'
      }
      return utils.wrapQuery.call(this, original, args, agent, {
        continuationMethod: 'callback',
        protocol: consts.PROTOCOLS.REDIS,
        host: host || 'unknown',
        method: methodString,
        url: 'unknown'
      })
    }
  })

  Shimmer.wrap(Multi.prototype, instrumentedCommands,
    function (original, name) {
      return function () {
        var args = Array.prototype.slice.apply(arguments)
        this.__trace = this.__trace || []
        this.__trace.push(name)
        return original.apply(this, args)
      }
    })
  return Multi
}

module.exports = {
  instrumentations: [{
    path: 'redis',
    pre: function () {
      Module._load('redis/lib/multi', arguments[3])
      return Array.prototype.slice.call(arguments, 2)
    },
    post: wrapRedisClient
  }, {
    path: 'redis/lib/multi',
    post: wrapMulti
  }]
}
