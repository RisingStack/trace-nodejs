'use strict'
var Module = require('module')
var path = require('path')
var assign = require('lodash.assign')
var debug = require('../utils/debug')('instrumentation')
var format = require('util').format

var shimmer = require('../utils/shimmer')

function loadInstrumentationsForTarget (name, path) {
  var instrumentations
  try {
    instrumentations = require(path)
  } catch (err) {
    debug.warn('loadInstrumentationsForTarget',
      format('instrumentation failed for `%s`. Could not load `%s`. Reason: %s',
        name, path, err.stack))
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
        return debug.warn('buildInstrumentationIndex',
          format('multiple instrumentations found for path %s. Overriding previous', inst.path))
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
      pkg = Module._load.call(this, path.join(target.name, 'package.json'), loadArguments[1])
    } catch (err) {
      debug.warn('instrumentModule', format('[Warning] cannot load `[%s] package.json`, ' +
      'although it was requested by the instrumentation group. Instrumentation might not work properly. ' +
      'Err: %s', target.name, err.stack))
    }
  }
  if (instrumentation.pre) {
    try {
      loadArguments = instrumentation.pre.apply(this, [agent, pkg].concat(loadArguments))
      debug.info('instrumentModule', format('Preload hook applied to module `[%s] %s`',
        target.name, instrumentation.path))
    } catch (err) {
      debug.error('instrumentModule', format(
        '[Error] Failed applying preload hook to module `[%s] %s`: %s. Instrumentation may not work properly',
        target.name, instrumentation.path, err.stack
      ))
    }
  }
  var loadedModule = load.apply(this, loadArguments)
  if (loadedModule && instrumentation.post) {
    try {
      loadedModule = instrumentation.post.call(this, loadedModule, agent, pkg)
      debug.info('instrumentModule', format('Postload hook applied to module `[%s] %s`',
        target.name, instrumentation.path))
    } catch (err) {
      debug.error('instrumentModule', format(
        'Failed applying postload hook to module `[%s] %s`: %s. Instrumentation may not work properly',
        target.name, instrumentation.path, err.stack
      ))
    }
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
          debug.error('loadTargetsEagerly', format('Could not load module `[%s] %s`: %s',
            target.name, instrumentation.path, err.stack))
        }
      }
    })
  })
}

// patching most commonly used node modules
module.exports.create = function (options) {
  var agent = options.agent
  var config = options.config || { }
  var instrumentations = options.instrumentations || { }
  var disableInstrumentations = config.disableInstrumentations || []

  var libraryTargets = Object.keys(instrumentations)
    .filter(function (tgt) {
      return disableInstrumentations.indexOf(tgt) === -1
    })
    .map(function (tgt) {
      return loadInstrumentationsForTarget(tgt, instrumentations[tgt])
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
        debug.info('create', format('successfully instrumented `[%s] %s`',
          lookupEntry.target.name, lookupEntry.instrumentation.path))
        lookupEntry.wrapped = true
        return wrapped
      } else {
        return load.apply(this, arguments)
      }
    }
  })

  shimmer.wrap(process, '_fatalException', function (original) {
    return function (error) {
      agent.tracer.collector.systemError(error)
      agent.tracer.sampleAll()
      var sync = true
      agent.tracer.send(sync)
      return original.apply(this, arguments)
    }
  })

  loadTargetsEagerly(libraryTargets.filter(function (lib) {
    return lib.type === 'core'
  }))
}
