var Shimmer = require('../utils/shimmer')

module.exports = function (Q, agent) {
  Shimmer.wrap(Q.makePromise.prototype, 'then', function (original) {
    return function (fulfill, reject, progress) {
      if (typeof fulfill === 'function') {
        fulfill = agent.storage.bind(fulfill)
      }
      if (typeof reject === 'function') {
        reject = agent.storage.bind(reject)
      }
      if (typeof progress === 'function') {
        progress = agent.storage.bind(progress)
      }

      return original.call(
        this,
        fulfill,
        reject,
        progress
      )
    }
  })

  return Q
}
