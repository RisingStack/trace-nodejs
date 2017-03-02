'use strict'
var Shimmer = require('../../utils/shimmer')
var mustCollectStore = {}

var wrapper = function (https, agent) {
  Shimmer.wrap(https.Server.prototype, ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./../trace-instrumentation-http/server.js')(listener, agent, mustCollectStore))
        } else {
          return addListener.apply(this, arguments)
        }
      }
    })

  agent.storage.bindEmitter(https.Server.prototype)

  return https
}

module.exports = {
  type: 'core',
  instrumentations: [{
    path: 'https',
    post: wrapper
  }]
}
