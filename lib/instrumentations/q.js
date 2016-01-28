var Shimmer = require('../utils/shimmer')

module.exports = function (Q, ns) {
  Shimmer.wrap(Q.makePromise.prototype, 'Q.makePromise.prototype', 'then', function (original) {
    return function (fulfill, reject, progress) {
      if (typeof fulfill === 'function') {
        fulfill = ns.bind(fulfill)
      }
      if (typeof reject === 'function') {
        reject = ns.bind(reject)
      }
      if (typeof progress === 'function') {
        progress = ns.bind(progress)
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
