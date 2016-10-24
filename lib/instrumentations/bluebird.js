var Shimmer = require('../utils/shimmer')

var wrapper = function (bluebird, agent) {
  Shimmer.wrap(bluebird.prototype, '_addCallbacks', function (original) {
    return function (fulfill, reject, progress, promise, receiver, domain) {
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
        progress,
        promise,
        receiver,
        domain
      )
    }
  })

  return bluebird
}

module.exports = {
  instrumentations: [
    {
      path: 'bluebird/js/release/promise',
      pre: wrapper
    },
    {
      path: 'bluebird/js/main/promise',
      post: wrapper
    },
    {
      path: 'bluebird',
      post: wrapper
    }
  ]
}
