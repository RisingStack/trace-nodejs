var Module = require('module')
var path = require('path')
var assign = require('lodash.assign')
var debug = require('debug')('risingstack/trace:instrumentations')
var format = require('util').format

var shimmer = require('../utils/shimmer')

var INSTRUMENTED_LIBS = {
  'http': './core/http',
  'https': './core/https',
  'mongoose': './mongoose',
  'mongodb': './mongodb',
  'bluebird': './bluebird',
  'redis': './redis',
  'ioredis': './ioredis',
  'mysql': './mysql',
  'when': './when',
  'q': './q',
  'koa': './koa',
  'express': './express',
  'pg': './pg',
  'amqplib': './amqplib'
}

function loadInstrumentationsForTarget (name, path) {
  var instrumentations
  try {
    instrumentations = require(path)
  } catch (err) {
    debug('#loadInstrumentationsForTarget',
      format('[Warning] instrumentation failed for `%s`. Could not load `%s`. Reason: %s',
        name, path, err)
    )
    debug(err)
  }
  if (!instrumentations) {
    return
  }
  if (typeof instrumentations === 'function') {
    return {
      name: name,
      instrumentations: [{
        path: name,
        post: instrumentations
      }]
    }
  } else {
    return assign({ name: name }, instrumentations)
  }
}

function buildInstrumentationLookup (libraryTargets) {
  var instrumentationLookup = {}

  libraryTargets.forEach(function (target) {
    target.instrumentations.forEach(function (inst) {
      if (inst.path == null) {
        return
      }
      if (instrumentationLookup[inst.path]) {
        return debug('#buildInstrumentationIndex',
          format(
            '[Warning] multiple instrumentations found for path %s. Overriding previous',
            inst.path
          ))
      }
      instrumentationLookup[inst.path] = {
        target: target,
        instrumentation: inst
      }
    })
  })
  return instrumentationLookup
}

function instrumentModule (target, instrumentation, agent, load) {
  var loadArguments = Array.prototype.slice.call(arguments, 4)
  var pkg
  if (target.package) {
    try {
      pkg = Module._load.call(this, path.join(target.name, 'package.json'), this)
    } catch (err) {
      debug('#instrumentModule', format('[Warning] cannot load `[%s] package.json`, ' +
      'although it was requested by the instrumentation group. Instrumentation might not work properly. ' +
      'Err: %s', target.name, err.message))
    }
  }
  if (instrumentation.pre) {
    try {
      loadArguments = instrumentation.pre.apply(this, [agent, pkg].concat(loadArguments))
    } catch (err) {
      debug('#instrumentModule', format(
        '[Error] Failed applying preload hook to module `[%s] %s`: %s. Instrumentation may not work properly',
        target.name, instrumentation.path, err.message
      ))
    }
    debug('#instrumentModule', format('Preload hook applied to module `[%s] %s`',
      target.name, instrumentation.path))
  }
  var loadedModule = load.apply(this, loadArguments)
  if (loadedModule && instrumentation.post) {
    try {
      loadedModule = instrumentation.post.call(this, loadedModule, agent, pkg)
    } catch (err) {
      debug('#instrumentModule', format(
        '[Error] Failed applying postload hook to module `[%s] %s`: %s. Instrumentation may not work properly',
        target.name, instrumentation.path, err.message
      ))
    }
    debug('#instrumentModule', format('Postload hook applied to module `[%s] %s`',
      target.name, instrumentation.path))
  }
  return loadedModule
}

function loadTargetsEagerly (targets) {
  targets.forEach(function (target) {
    target.instrumentations.forEach(function (instrumentation) {
      if (instrumentation.path) {
        try {
          require(instrumentation.path)
        } catch (err) {
          debug('#loadTargetsEagerly', format('[Warning] Could not load module `[%s] %s`: `%s`',
            target.name, instrumentation.path, err.message))
        }
      }
    })
  })
}

// patching most commonly used node modules
module.exports.create = function (options) {
  var agent = options.agent
  var config = options.config || { }
  var disableInstrumentations = config.disableInstrumentations || []

  var libraryTargets = Object.keys(INSTRUMENTED_LIBS)
    .filter(function (tgt) {
      return disableInstrumentations.indexOf(tgt) === -1
    })
    .map(function (tgt) {
      return loadInstrumentationsForTarget(tgt, INSTRUMENTED_LIBS[tgt])
    })
    .filter(function (tgt) { return !!tgt })

  var instrumentationLookup = buildInstrumentationLookup(libraryTargets)

  shimmer.wrap(Module, '_load', function (load) {
    return function (file, parent) {
      var lookupEntry = instrumentationLookup[file]
      if (lookupEntry && !lookupEntry.wrapped) {
        var wrapped = instrumentModule.apply(
          this, [
            lookupEntry.target,
            lookupEntry.instrumentation,
            agent,
            load
          ].concat(Array.prototype.slice.apply(arguments))
        )
        debug('#create', format('successfully instrumented `[%s] %s`',
          lookupEntry.target.name, lookupEntry.instrumentation.path))
        lookupEntry.wrapped = true
        return wrapped
      } else {
        return load.apply(this, arguments)
      }
    }
  })

  shimmer.wrap(process, '_fatalException', function (original) {
    return function (stackTrace) {
      agent.onCrash({
        stackTrace: stackTrace
      })

      return original.apply(this, arguments)
    }
  })

  loadTargetsEagerly(libraryTargets.filter(function (lib) {
    return lib.type === 'core'
  }))
}

module.exports.INSTRUMENTED_LIBS = INSTRUMENTED_LIBS
