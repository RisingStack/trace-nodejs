'use strict'
var Shimmer = require('../utils/shimmer')

module.exports = function (koa, agent) {
  Shimmer.wrap(koa.prototype, 'onerror', function (original) {
    return function (error) {
      agent.tracer.collector.userSentError('koa_error', error)
      return original.apply(this, arguments)
    }
  })

  return koa
}
