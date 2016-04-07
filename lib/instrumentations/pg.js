var semver = require('semver')

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
  if (semver.satisfies(version, '>= 4.0.0')) {
    wrapClient(native, agent)
    return
  }
  console.warn('trace: warning: You are using node-postgres version ' +
    version + ', (<4.0.0) so native queries won\'t be instrumented.'
  )
}

function wrapClient (pg, agent) {
  Shimmer.wrap(pg.Client.prototype, 'pg.Client.prototype', 'query', function (original) {
    return function () {
      var host = this.host
      var url = this.database
      var args = Array.prototype.slice.apply(arguments)

      return wrapQuery.call(this, original, args, agent, {
        url: url,
        host: host,
        method: tryParseSql(args[0]) // TODO: parse SQL
      })
    }
  })
}

module.exports = function wrap (pg, agent, pkg) {
  var original = pg.__lookupGetter__('native')
  if (original) {
    delete pg.native
    pg.__defineGetter__('native', function getNative () {
      var tmp = original()
      wrapNative(tmp, agent, pkg.version)
      return tmp
    })
  }

  wrapClient(pg, agent)

  return pg
}
