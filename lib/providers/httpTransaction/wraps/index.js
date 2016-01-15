var http = require('http')

var httpServerFactory = require('./http.Server.prototype.js')
var httpRequestFactory = require('./http.request.js')
var fatalExceptionFactory = require('./process._fatalException.js')

var getNamespace = require('continuation-local-storage').getNamespace
var Shimmer = require('./shimmer')
var mustCollectStore = {}

var NAMESPACE = 'trace'

function instrument (collector, config) {
  Shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'],
    function (addListener) {
      var wrappedHttpServerListener

      return function (type, originalListener) {
        if (type === 'request' && typeof listener === 'function') {
          wrappedHttpServerListener = httpServerFactory(
            originalListener,
            collector,
            config,
            mustCollectStore
          )

          return addListener.call(this, type, wrappedHttpServerListener)
        } else {
          return addListener.apply(this, arguments)
        }
      }
    })

  Shimmer.wrap(http, 'http', 'request', function (originalRequest) {
    return httpRequestFactory(originalRequest, collector, config, mustCollectStore)
  })

  Shimmer.wrap(process, 'process', '_fatalException', function (originalFatalException) {
    return fatalExceptionFactory(originalFatalException, collector, config)
  })

  getNamespace(NAMESPACE).bindEmitter(http.Server.prototype)
}

function uninstrument () {
  Shimmer.unwrap(http.Server.prototype, 'http.Server.prototype', 'addListener')
  Shimmer.unwrap(http.Server.prototype, 'http.Server.prototype', 'addListener')

  Shimmer.unwrap(http, 'http', 'request')

  Shimmer.unwrap(process, 'process', '_fatalException')
}

module.exports.instrument = instrument
module.exports.uninstrument = uninstrument
