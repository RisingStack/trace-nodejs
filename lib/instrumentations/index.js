var Module = require('module')
var path = require('path')
var fs = require('fs')
var debug = require('debug')('risingstack/trace:instrumentations')

var shimmer = require('../utils/shimmer')

var INSTRUMENTED_LIBS = [
  // from npm
  'mongoose',
  'mongodb',
  'bluebird',
  'redis',
  'mysql',
  'when',
  'q',
  'koa',
  'express',
  // knex and bookshelf does some black magic, so we have to do this :(
  'bluebird.main'
]

var CORE_LIBS = [
  'http'
]

function instrument (shortName, fileName, nodule, agent) {
  var newNodule

  if (!fs.existsSync(fileName)) {
    return debug('not found %s', fileName)
  }

  newNodule = require(fileName)(nodule, agent)

  return newNodule
}

function postLoadHook (nodule, name, agent) {
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
      nodule = instrument(base, fileName, nodule, agent)
      nodule._instrumentedByTrace = true
    } catch (ex) {
      debug('failed to instrument %s using %s', name, fileName)
    }
  }

  return nodule
}

// patching most commonly used node modules
module.exports.create = function (options) {
  shimmer.wrap(process, 'process', '_fatalException', function (original) {
    return function (stackTrace) {
      options.agent.onCrash({
        stackTrace: stackTrace
      })

      return original.apply(this, arguments)
    }
  })

  CORE_LIBS.forEach(function (core) {
    var fileName = core + '.js'
    var filePath = path.join(__dirname, 'core', fileName)
    instrument(fileName, filePath, require(core), options.agent)
  })

  shimmer.wrap(Module, 'Module', '_load', function (load) {
    return function (file) {
      return postLoadHook(load.apply(this, arguments), file, options.agent)
    }
  })
}
