var Shimmer = require('../utils/shimmer')

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
}
