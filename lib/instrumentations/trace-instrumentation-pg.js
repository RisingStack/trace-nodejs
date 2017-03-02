'use strict'
var semver = require('semver')
var debug = require('../utils/debug')('instrumentation')
var consts = require('../consts')
var Shimmer = require('../utils/shimmer')
var utils = require('./utils')

function wrapNative (native, agent, version) {
  // We support it only versions gte 4.0.0
  if (!version) {
    debug.error('postgres', 'cannot determine postgres version. ' +
      '(No package.json?) Native queries won\'t be instrumented.')
  } else if (!semver.satisfies(version, '>= 4.0.0')) {
    debug.warn('postgres', 'you are using node-postgres version ' +
      version + ', (<4.0.0) so native queries won\'t be instrumented.')
  } else {
    wrapClient(native, agent)
  }
}

function wrapClient (pg, agent) {
  Shimmer.wrap(pg.Client.prototype, 'query', function (original) {
    return function () {
      var host = this.host
      var url = this.database
      var port = this.port
      var args = Array.prototype.slice.apply(arguments)
      var isCallback = typeof args[args.length - 1] === 'function'

      return utils.wrapQuery.call(this, original, args, agent, {
        protocol: consts.PROTOCOLS.POSTGRES,
        url: url,
        host: port ? host + ':' + port : host,
        method: utils.tryParseSql(args[0]) || 'unknown',
        continuationMethod: isCallback ? 'callback' : 'eventEmitter'
      })
    }
  })
}

var wrapper = function (pg, agent, pkg) {
  var version = pkg ? pkg.version : undefined
  var original
  if (pg.__lookupGetter__ && pg.__defineGetter__ && (original = pg.__lookupGetter__('native'))) {
    delete pg.native
    pg.__defineGetter__('native', function getNative () {
      var tmp = original()
      wrapNative(tmp, agent, version)
      return tmp
    })
  }

  wrapClient(pg, agent)

  return pg
}

module.exports = {
  package: true,
  instrumentations: [{
    path: 'pg',
    post: wrapper
  }]
}
