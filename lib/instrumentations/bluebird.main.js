var Shimmer = require('../utils/shimmer')

module.exports = function (bluebird, agent) {
  var Bluebird = bluebird()
  Shimmer.wrap(Bluebird.prototype, 'Bluebird.prototype', '_addCallbacks', function (original) {
    return function (fulfill, reject, progress, promise, receiver, domain) {
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
        progress,
        promise,
        receiver,
        domain
      )
    }
  })

  return function () {
    return Bluebird
  }
}
