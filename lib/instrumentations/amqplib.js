var shimmer = require('../utils/shimmer')

function connectionWrapper (Connection, agent) {
  shimmer.wrap(Connection.Connection.prototype, 'sendMessage', function (original) {
    return function (channel, Method, fields, Properties, props, content) {
      return original.apply(this, arguments)
    }
  })
  return Connection
}

function callbackModelWrapper (CallbackModel, agent) {
  shimmer.wrap(CallbackModel.Channel.prototype, 'consume', function (original) {
    return function (queue, callback, options, cb0) {
      return original.apply(this, arguments)
    }
  })
  return CallbackModel
}

function channelModelWrapper (ChannelModel, agent) {
  shimmer.wrap(ChannelModel.Channel.prototype, 'consume', function (original) {
    return function (queue, callback, options) {
      return original.apply(this, arguments)
    }
  })
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
      require('amqplib/lib/channel_model')
      return Array.prototype.slice.call(arguments, 2)
    }
  }, {
    path: 'amqplib/channel_api',
    pre: function () {
      require('amqplib/lib/connection')
      return Array.prototype.slice.call(arguments, 2)
    }
  }, {
    path: 'amqplib/callback_api',
    pre: function () {
      require('amqplib/lib/connection')
      return Array.prototype.slice.call(arguments, 2)
    }
  }, {
    path: 'amqplib/lib/channel_model',
    pre: function () {
      require('amqplib/lib/connection')
      return Array.prototype.slice.call(arguments, 2)
    },
    post: channelModelWrapper
  }, {
    path: 'amqplib/lib/callback_model',
    pre: function () {
      require('amqplib/lib/connection')
      return Array.prototype.slice.call(arguments, 2)
    },
    post: callbackModelWrapper
  }, {
    path: 'amqplib/lib/connection',
    post: connectionWrapper
  }]
}
