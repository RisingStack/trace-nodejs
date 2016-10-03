var Shimmer = require('../utils/shimmer')

module.exports = function (when, agent) {
  Shimmer.wrap(when.Promise.prototype, 'then', function (original) {
    return function (onFulfilled, onRejected, onProgress) {
      if (typeof onFulfilled === 'function') {
        onFulfilled = agent.bind(onFulfilled)
      }

      if (typeof onRejected === 'function') {
        onRejected = agent.bind(onRejected)
      }

      if (typeof onProgress === 'function') {
        onProgress = agent.bind(onProgress)
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
