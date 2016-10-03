var Shimmer = require('../utils/shimmer')

module.exports = function (koa, agent) {
  Shimmer.wrap(koa.prototype, 'onerror', function (original) {
    return function (error) {
      agent.reportError('koa_error', error)
      return original.apply(this, arguments)
    }
  })

  return koa
}
