'use strict'
var Shimmer = require('../../utils/shimmer')

var wrapper = function (http, agent) {
  Shimmer.wrap(http.Server.prototype, ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./server.js')(listener, agent))
        } else {
          return addListener.apply(this, arguments)
        }
      }
    })

  Shimmer.wrap(http, 'request', function (original) {
    return require('./request.js')(original, agent)
  })

  agent.storage.bindEmitter(http.Server.prototype)

  return http
}

module.exports = {
  type: 'core',
  instrumentations: [{
    path: 'http',
    post: wrapper
  }]
}
