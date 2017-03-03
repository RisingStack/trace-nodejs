var Shimmer = require('../utils/shimmer')

module.exports = function (koa, agent) {
  Shimmer.wrap(koa.prototype, 'onerror', function (original) {
    return function (error) {
      var briefcase = agent.storage.get('tracer.briefcase')
      agent.tracer.collector.userSentError(briefcase, 'koa_error', error)
      return original.apply(this, arguments)
    }
  })

  return koa
}
