var Module = require('module')
var path = require('path')
var assign = require('lodash.assign')
var debug = require('debug')('risingstack/trace:instrumentations')
var format = require('util').format

var shimmer = require('../utils/shimmer')

// TODO[NODE-18]: unify INSTRUMENTED_LIBS and CORE_LIBS

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
  'pg',
  'amqplib'
]

var CORE_LIBS = [
  'http',
  'https'
]

function loadInstrumentationsForTarget (name, prefix) {
  prefix = prefix || ''
  var instrumentationsPath = path.resolve(__dirname, prefix, name)
  var instrumentations
  try {
    instrumentations = require(instrumentationsPath)
  } catch (err) {
    debug('#loadInstrumentationsForTarget',
      format('[Warning] instrumentation group `%s` not found on path `%s`. Skipping',
        name, instrumentationsPath)
    )
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

  // TODO[NODE-18]: unify INSTRUMENTED_LIBS and CORE_LIBS

  var coreTargets = CORE_LIBS
    .filter(function (tgt) {
      return disableInstrumentations.indexOf(tgt) === -1
    })
    .map(function (tgt) {
      return loadInstrumentationsForTarget(tgt, 'core')
    })
    .filter(function (tgt) { return !!tgt })

  var libraryTargets = INSTRUMENTED_LIBS
    .filter(function (tgt) {
      return disableInstrumentations.indexOf(tgt) === -1
    })
    .map(function (tgt) {
      return loadInstrumentationsForTarget(tgt)
    })
    .filter(function (tgt) { return !!tgt })

  var instrumentationLookup = buildInstrumentationLookup(coreTargets.concat(libraryTargets))

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

  loadTargetsEagerly(coreTargets)
}

module.exports.INSTRUMENTED_LIBS = INSTRUMENTED_LIBS
module.exports.CORE_LIBS = CORE_LIBS
