var Shimmer = require('../utils/shimmer')

module.exports = function (ns) {
  var mongoose = require('mongoose')
  var mongodb = require('mongoose/node_modules/mongodb')

  Shimmer.wrap(mongodb.Collection.prototype, 'mongodb.Collection.prototype', [
    'insert',
    'insertMany',
    'insertOne',
    'save'
  ], function (original) {
    return function (docs, options, callback) {
      callback = ns.bind(callback)
      return original.call(this, docs, options, callback)
    }
  })

  Shimmer.wrap(mongodb.Collection.prototype, 'mongodb.Collection.prototype', [
    'update',
    'updateMany',
    'updateOne'
  ], function (original) {
    return function (filter, update, options, callback) {
      callback = ns.bind(callback)
      return original.call(this, filter, update, options, callback)
    }
  })

  Shimmer.wrap(mongodb.Collection.prototype, 'mongodb.Collection.prototype', [
    'remove',
    'deleteOne',
    'deleteMany'
  ], function (original) {
    return function (filter, options, callback) {
      callback = ns.bind(callback)
      return original.call(this, filter, options, callback)
    }
  })

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
