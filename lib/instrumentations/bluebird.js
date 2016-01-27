var Shimmer = require('../utils/shimmer')

module.exports = function (bluebird, ns) {
  Shimmer.wrap(bluebird.prototype, 'bluebird.prototype', '_addCallbacks', function (original) {
    return function (fulfill, reject, progress, promise, receiver, domain) {
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
        progress,
        promise,
        receiver,
        domain
      )
    }
  })

  return bluebird
}
