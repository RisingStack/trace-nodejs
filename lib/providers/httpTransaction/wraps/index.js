var http = require('http')

var getNamespace = require('continuation-local-storage').getNamespace
var Shimmer = require('../../../utils/shimmer')
var mustCollectStore = {}

function instrument (collector, config) {
  Shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./http.Server.prototype.js')(listener, collector, config, mustCollectStore))
        } else {
          return addListener.apply(this, arguments)
        }
      }
    })

  Shimmer.wrap(http, 'http', 'request', function (original) {
    return require('./http.request.js')(original, collector, config, mustCollectStore)
  })

  Shimmer.wrap(process, 'process', '_fatalException', function (original) {
    return require('./process._fatalException.js')(original, collector, config)
  })

  getNamespace('trace').bindEmitter(http.Server.prototype)
}

function uninstrument () {
  Shimmer.unwrap(http.Server.prototype, 'http.Server.prototype', 'addListener')
  Shimmer.unwrap(http.Server.prototype, 'http.Server.prototype', 'addListener')

  Shimmer.unwrap(http, 'http', 'request')

  Shimmer.unwrap(process, 'process', '_fatalException')
}

module.exports.instrument = instrument
module.exports.uninstrument = uninstrument
