var Shimmer = require('../utils/shimmer')

module.exports = function (Q, agent) {
  Shimmer.wrap(Q.makePromise.prototype, 'then', function (original) {
    return function (fulfill, reject, progress) {
      if (typeof fulfill === 'function') {
        fulfill = agent.bind(fulfill)
      }
      if (typeof reject === 'function') {
        reject = agent.bind(reject)
      }
      if (typeof progress === 'function') {
        progress = agent.bind(progress)
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
