var Shimmer = require('../utils/shimmer')

var MODEL_METHODS = [
  'save',
  'remove'
]

module.exports = function (mongoose, ns) {
  Shimmer.wrap(mongoose.Mongoose.prototype.Query.prototype, 'mongoose.Mongoose.prototype.Query.prototype', 'exec', function (original) {
    return function (op, callback) {
      if (typeof op === 'function') {
        op = ns.bind(op)
      }
      if (typeof callback === 'function') {
        callback = ns.bind(callback)
      }
      return original.call(this, op, callback)
    }
  })

  Shimmer.wrap(mongoose.Mongoose.prototype.Query.base, 'mongoose.Mongoose.prototype.Query.base', '_wrapCallback', function (original) {
    return function (method, callback, queryInfo) {
      if (typeof callback === 'function') {
        callback = ns.bind(callback)
      }
      return original.call(this, method, callback, queryInfo)
    }
  })

  Shimmer.wrap(mongoose.Mongoose.prototype.Model.prototype, 'mongoose.Mongoose.prototype.Model.prototype', MODEL_METHODS, function (original) {
    return function (options, fn) {
      if (typeof options === 'function') {
        options = ns.bind(options)
      }
      if (typeof fn === 'function') {
        fn = ns.bind(fn)
      }

      original.call(this, options, fn)
    }
  })

  return mongoose
}
