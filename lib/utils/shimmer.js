'use strict'
// from: https://github.com/othiym23/shimmer
var debug = require('debug')('risingstack/trace')

// Keep initialization idempotent.
var shimmer = {}

var instrumented = []

var isTest = process.env.NODE_ENV === 'test'

function wrap (nodule, noduleName, methods, wrapper) {
  if (!methods) {
    return debug('Must include a method name to wrap')
  }

  if (!noduleName) {
    noduleName = '[unknown]'
  }
  if (!Array.isArray(methods)) {
    methods = [methods]
  }

  methods.forEach(function (method) {
    var fqmn = noduleName + '.' + method

    if (!nodule) {
      return
    }
    if (!wrapper) {
      return
    }

    var original = nodule[method]

    if (!original) {
      return debug('%s not defined, so not wrapping.', fqmn)
    }
    if (original.__RS_unwrap) {
      return debug('%s already wrapped by agent.', fqmn)
    }

    if (original.__NR_original) {
      return debug('%s already wrapped the newrelic agent, so it is wrapped by us as well', fqmn)
    }

    var wrapped = wrapper(original, method)
    wrapped.__RS_original = original
    // eslint-disable-next-line camelcase
    wrapped.__RS_unwrap = function __RS_unwrap () {
      nodule[method] = original
      debug('Removed instrumentation from %s.', fqmn)
    }

    if (isTest) {
      instrumented.push(wrapped)
    }

    debug('Instrumented %s.', fqmn)

    nodule[method] = wrapped
  })
}

function unwrap (nodule, noduleName, method) {
  if (!noduleName) {
    noduleName = '[unknown]'
  }
  if (!method) {
    return
  }

  if (!nodule) {
    return
  }
  var wrapped = nodule[method]

  if (!wrapped) {
    return
  }
  if (!wrapped.__RS_unwrap) {
    return
  }

  wrapped.__RS_unwrap()
}

function unwrapAll () {
  if (!isTest) {
    debug('WARNING: You called unwrapAll(), but you aren\'t in a testing ' +
    'environment. This operation will most likely be ineffective. ' +
    'Set NODE_ENV=test')
  }
  instrumented.forEach(function (wrapper) {
    wrapper.__RS_unwrap()
  })
  instrumented = []
}

shimmer.wrap = wrap
shimmer.unwrap = unwrap
shimmer.unwrapAll = unwrapAll

module.exports = shimmer
