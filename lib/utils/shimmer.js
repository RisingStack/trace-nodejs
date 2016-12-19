'use strict'
// from: https://github.com/othiym23/shimmer

function wrap (nodule, methods, wrapper) {
  if (!nodule || !wrapper || !methods) {
    return nodule
  }
  if (!Array.isArray(methods)) {
    methods = [methods]
  }

  methods.forEach(function (method) {
    if (!method) {
      return nodule
    }
    var original = nodule[method]

    var originalMethodName = method + '__RS_original'

    if (!original || nodule[originalMethodName]) {
      return nodule
    }

    var wrapped = wrapper(original, method)
    nodule[originalMethodName] = original

    nodule[method] = wrapped
  })

  return nodule
}

function unwrap (nodule, methods) {
  if (!nodule || !methods) {
    return nodule
  }
  if (!Array.isArray(methods)) {
    methods = [methods]
  }
  methods.forEach(function (method) {
    if (!method) {
      return nodule
    }

    var originalMethodName = method + '__RS_original'

    var wrapped = nodule[method]

    if (!wrapped || !nodule[originalMethodName]) {
      return nodule
    }
    nodule[method] = nodule[originalMethodName]

    delete nodule[originalMethodName]
  })

  return nodule
}

module.exports = {
  wrap: wrap,
  unwrap: unwrap
}
