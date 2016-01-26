var Shimmer = require('../utils/shimmer')

module.exports = function (mongodb, ns) {
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
}
