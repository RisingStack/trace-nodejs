var Shimmer = require('../utils/shimmer')

module.exports = function (when, ns) {
  Shimmer.wrap(when.Promise.prototype, 'when.Promise.prototype', 'then', function (original) {
    return function (onFulfilled, onRejected, onProgress) {
      if (typeof onFulfilled === 'function') {
        onFulfilled = ns.bind(onFulfilled)
      }

      if (typeof onRejected === 'function') {
        onRejected = ns.bind(onRejected)
      }

      if (typeof onProgress === 'function') {
        onProgress = ns.bind(onProgress)
      }

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
