var Module = require('module')
var path = require('path')
var fs = require('fs')
var debug = require('debug')('risingstack/trace:instrumentations')

var shimmer = require('../utils/shimmer')

var INSTRUMENTED_LIBS = [
  'mongoose',
  'mongodb',
  'bluebird'
]

function instrument (shortName, fileName, nodule, session) {
  var fullPath = path.resolve(fileName)
  if (!fs.existsSync(fileName)) {
    return debug('not found %s', fileName)
  }
  try {
    require(fileName)(nodule, session)
  } catch (error) {
    return debug('failed to instrument %s using %s', shortName, fullPath)
  }
}

function postLoadHook (nodule, name, session) {
  var base = path.basename(name)

  if (INSTRUMENTED_LIBS.indexOf(base) !== -1) {
    debug('Instrumenting %s.', base)
    var fileName = path.join(__dirname, base + '.js')
    instrument(base, fileName, nodule, session)
  }

  return nodule
}

// patching most commonly used node modules
module.exports = function (session) {
  shimmer.wrap(Module, 'Module', '_load', function (load) {
    return function (file) {
      return postLoadHook(load.apply(this, arguments), file, session)
    }
  })
}
