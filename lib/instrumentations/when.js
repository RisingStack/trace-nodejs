var Shimmer = require('../utils/shimmer')

module.exports = function (when, ns) {
  Shimmer.wrap(when.Promise.prototype, 'when.Promise.prototype', 'then', function (original) {
    return function (onFulfilled, onRejected, onProgress) {
      onFulfilled = ns.bind(onFulfilled)
      onRejected = ns.bind(onRejected)
      onProgress = ns.bind(onProgress)

      return original.call(
        this,
        onFulfilled,
        onRejected,
        onProgress
      )
    }
  })

  return when
}
