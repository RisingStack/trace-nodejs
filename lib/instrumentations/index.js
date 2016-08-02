var Module = require('module')
var path = require('path')
var fs = require('fs')
var remove = require('lodash.remove')
var debug = require('debug')('risingstack/trace:instrumentations')

var shimmer = require('../utils/shimmer')

var INSTRUMENTED_LIBS = [
  // from npm
  'mongoose',
  'mongodb',
  'bluebird',
  'redis',
  'ioredis',
  'mysql',
  'when',
  'q',
  'koa',
  'express',
  // knex and bookshelf does some black magic, so we have to do this :(
  'bluebird.main',
  'pg'
]

var CORE_LIBS = [
  'http',
  'https'
]

function instrument (shortName, fileName, nodule, agent) {
  var newNodule

  if (!fs.existsSync(fileName)) {
    return debug('not found %s', fileName)
  }

  var pkg
  try {
    pkg = require(path.join(shortName, 'package.json'))
  } catch (err) {
    debug('cannot load package.json for %s: %s', shortName, err.message)
  }
  newNodule = require(fileName)(nodule, agent, pkg)

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
  var agent = options.agent
  var config = options.config || { }
  shimmer.wrap(process, 'process', '_fatalException', function (original) {
    return function (stackTrace) {
      agent.onCrash({
        stackTrace: stackTrace
      })

      return original.apply(this, arguments)
    }
  })

  var disableInstrumentations = config.disableInstrumentations || []

  disableInstrumentations.forEach(function (instrumentation) {
    remove(INSTRUMENTED_LIBS, function (lib) {
      return instrumentation === lib
    })

    remove(CORE_LIBS, function (lib) {
      return instrumentation === lib
    })
  })

  CORE_LIBS.forEach(function (core) {
    var fileName = core + '.js'
    var filePath = path.join(__dirname, 'core', fileName)
    instrument(fileName, filePath, require(core), agent)
  })

  shimmer.wrap(Module, 'Module', '_load', function (load) {
    return function (file) {
      return postLoadHook(load.apply(this, arguments), file, agent)
    }
  })
}

module.exports.INSTRUMENTED_LIBS = INSTRUMENTED_LIBS
module.exports.CORE_LIBS = CORE_LIBS
