'use strict'
// from: https://github.com/othiym23/shimmer
var debug = require('debug')('risingstack/trace')

// Keep initialization idempotent.
var shimmer = {}

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

    var wrapped = wrapper(original, method)
    wrapped.__RS_original = original
    wrapped.__RS_unwrap = function __RS_unwrap () {
      nodule[method] = original
      debug('Removed instrumentation from %s.', fqmn)
    }

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

shimmer.wrap = wrap
shimmer.unwrap = unwrap

module.exports = shimmer
