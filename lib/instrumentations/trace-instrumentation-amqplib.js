'use strict'
var shimmer = require('../utils/shimmer')
var Module = require('module')

var defaults = require('lodash.defaults')
var get = require('lodash.get')
var microtime = require('../optionalDependencies/@risingstack/microtime')
var debug = require('../utils/debug')('instrumentation')
var format = require('util').format

function tryParseInt (string) {
  if (!string) { return }
  var n = parseInt(string, 10)
  return isNaN(n) ? undefined : n
}

function consumerWrapper (agent, original) {
  return function (queue, callback, options, cb0) {
    var orig = callback
    var wrapped = function (msg) {
      var originTimestamp = tryParseInt(get(msg, 'properties.headers[\'x-client-send\']'))
      var parentServiceKey = tryParseInt(get(msg, 'properties.headers[\'x-parent\']'))
      var transportDelay = originTimestamp == null ? undefined : microtime.now() - originTimestamp
      debug.info('amqplib.consumerWrapper', format('incomingEdge [%s %s %s]', 'amqp', parentServiceKey, transportDelay))
      agent.incomingEdgeMetrics.report({
        serviceKey: parentServiceKey,
        protocol: 'amqp',
        transportDelay: transportDelay
      })
      if (typeof orig === 'function') {
        return orig.apply(this, arguments)
      }
    }
    var args = Array.prototype.slice.apply(arguments)
    args[1] = wrapped
    return original.apply(this, args)
  }
}

function sendMessageWrapper (agent, original) {
  return function (channel, Method, fields, Properties, props, content) {
    var traceHeaders = {
      'x-client-send': String(microtime.now()),
      'x-parent': String(agent.getServiceKey())
    }
    debug.info('amqplib.sendMessageWrapper', 'sending instrumented message...')
    defaults(fields.headers, traceHeaders)

    return original.apply(this, arguments)
  }
}

function connectionWrapper (Connection, agent) {
  shimmer.wrap(Connection.Connection.prototype, 'sendMessage', sendMessageWrapper.bind(null, agent))
  return Connection
}

function callbackModelWrapper (CallbackModel, agent) {
  shimmer.wrap(CallbackModel.Channel.prototype, 'consume', consumerWrapper.bind(null, agent))
  return CallbackModel
}

function channelModelWrapper (ChannelModel, agent) {
  shimmer.wrap(ChannelModel.Channel.prototype, 'consume', consumerWrapper.bind(null, agent))
  return ChannelModel
}

// rather convoluted dependency graph follows
// amqplib == amqplib/channel_api ---> amqplib/lib/channel_model
//                                               |
//                                               ˅
//                                       amqplib/lib/connection
//                                               ˄
//                                               |
// amqplib/callback_api ---> amqplib/lib/callback_model

module.exports = {
  instrumentations: [{
    path: 'amqplib',
    pre: function () {
      Module._load('amqplib/channel_api', arguments[3])
      return Array.prototype.slice.call(arguments, 2)
    }
  }, {
    path: 'amqplib/channel_api',
    pre: function () {
      Module._load('amqplib/lib/channel_model', arguments[3])
      return Array.prototype.slice.call(arguments, 2)
    }
  }, {
    path: 'amqplib/callback_api',
    pre: function () {
      Module._load('amqplib/lib/callback_model', arguments[3])
      return Array.prototype.slice.call(arguments, 2)
    }
  }, {
    path: 'amqplib/lib/channel_model',
    pre: function () {
      Module._load('amqplib/lib/connection', arguments[3])
      return Array.prototype.slice.call(arguments, 2)
    },
    post: channelModelWrapper
  }, {
    path: 'amqplib/lib/callback_model',
    pre: function () {
      Module._load('amqplib/lib/connection', arguments[3])
      return Array.prototype.slice.call(arguments, 2)
    },
    post: callbackModelWrapper
  }, {
    path: 'amqplib/lib/connection',
    post: connectionWrapper
  }]
}
