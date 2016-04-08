var semver = require('semver')
var debug = require('debug')('risingstack/trace')
var consts = require('../consts')
var Shimmer = require('../utils/shimmer')
var wrapQuery = require('./utils/wrapQuery')

// TODO(TR-209): write sql parser
function tryParseSql (raw) {
  if (typeof raw !== 'string') {
    return
  }
  var matches = /\s*(select|update|insert|delete)/i.exec(raw)
  return matches ? matches[1] : undefined
}

function wrapNative (native, agent, version) {
  // We support it only versions gte 4.0.0
  if (!version) {
    debug('trace: warning: Cannot determine postgres version. ' +
      '(No package.json?) Native queries won\'t be instrumented.'
    )
  } else if (!semver.satisfies(version, '>= 4.0.0')) {
    debug('trace: warning: You are using node-postgres version ' +
      version + ', (<4.0.0) so native queries won\'t be instrumented.'
    )
  } else {
    wrapClient(native, agent)
  }
}

function wrapClient (pg, agent) {
  Shimmer.wrap(pg.Client.prototype, 'pg.Client.prototype', 'query', function (original) {
    return function () {
      var host = this.host
      var url = this.database
      var args = Array.prototype.slice.apply(arguments)

      return wrapQuery.call(this, original, args, agent, {
        protocol: consts.PROTOCOLS.POSTGRES,
        url: url,
        host: host,
        method: tryParseSql(args[0]) // TODO: parse SQL
      })
    }
  })
}

module.exports = function wrap (pg, agent, pkg) {
  var version = pkg ? pkg.version : undefined
  var original = pg.__lookupGetter__('native')
  if (original) {
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
