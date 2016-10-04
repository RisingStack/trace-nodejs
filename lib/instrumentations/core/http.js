var Shimmer = require('../../utils/shimmer')
var mustCollectStore = {}

var wrapper = function (http, agent) {
  Shimmer.wrap(http.Server.prototype, ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./http/server.js')(listener, agent, mustCollectStore))
        } else {
          return addListener.apply(this, arguments)
        }
      }
    })

  Shimmer.wrap(http, 'request', function (original) {
    return require('./http/request.js')(original, agent, mustCollectStore)
  })

  agent.bindEmitter(http.Server.prototype)

  return http
}

module.exports = {
  type: 'core',
  instrumentations: [{
    path: 'http',
    post: wrapper
  }]
}
