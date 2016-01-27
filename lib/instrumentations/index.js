var Module = require('module')
var path = require('path')
var fs = require('fs')
var debug = require('debug')('risingstack/trace:instrumentations')

var shimmer = require('../utils/shimmer')

var INSTRUMENTED_LIBS = [
  'mongoose',
  'mongodb',
  'bluebird',
  // knex and bookshelf does some black magic, so we have to do this :(
  'bluebird.main'
]

function instrument (shortName, fileName, nodule, session) {
  var newNodule

  if (!fs.existsSync(fileName)) {
    return debug('not found %s', fileName)
  }

  newNodule = require(fileName)(nodule, session)

  return newNodule
}

function postLoadHook (nodule, name, session) {
  var instrumentation
  var base = path.basename(name)

  // knex and bookshelf does some black magic, so we have to do this :(
  if (name === 'bluebird/js/main/promise') {
    instrumentation = 'bluebird.main'
  } else {
    instrumentation = base
  }

  if (INSTRUMENTED_LIBS.indexOf(instrumentation) !== -1) {
    debug('Instrumenting %s.', base)
    var fileName = path.join(__dirname, instrumentation + '.js')
    try {
      nodule = instrument(base, fileName, nodule, session)
    } catch (ex) {
      debug('failed to instrument %s using %s', name, fileName)
    }
  }

  return nodule
}

// patching most commonly used node modules
module.exports.instrument = function (session) {
  shimmer.wrap(Module, 'Module', '_load', function (load) {
    return function (file) {
      return postLoadHook(load.apply(this, arguments), file, session)
    }
  })
}
