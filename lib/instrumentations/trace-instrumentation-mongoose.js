'use strict'
var Shimmer = require('../utils/shimmer')

var MODEL_METHODS = [
  'save',
  'remove'
]

module.exports = function (mongoose, agent) {
  Shimmer.wrap(mongoose.Mongoose.prototype.Query.prototype, 'exec', function (original) {
    return function (op, callback) {
      if (typeof op === 'function') {
        op = agent.storage.bind(op)
      }
      if (typeof callback === 'function') {
        callback = agent.storage.bind(callback)
      }
      return original.call(this, op, callback)
    }
  })

  Shimmer.wrap(mongoose.Mongoose.prototype.Query.base, '_wrapCallback', function (original) {
    return function (method, callback, queryInfo) {
      if (typeof callback === 'function') {
        callback = agent.storage.bind(callback)
      }
      return original.call(this, method, callback, queryInfo)
    }
  })

  Shimmer.wrap(mongoose.Mongoose.prototype.Model.prototype, MODEL_METHODS, function (original) {
    return function (options, fn) {
      if (typeof options === 'function') {
        options = agent.storage.bind(options)
      }
      if (typeof fn === 'function') {
        fn = agent.storage.bind(fn)
      }

      original.call(this, options, fn)
    }
  })

  return mongoose
}
