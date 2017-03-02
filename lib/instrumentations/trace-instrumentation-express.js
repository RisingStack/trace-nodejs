'use strict'
var debug = require('../utils/debug')('instrumentation')
var Shimmer = require('../utils/shimmer')

module.exports = function (express, agent) {
  var isVersion4 = !!express &&
    express.Router &&
    express.Router.process_params &&
    express.application &&
    express.application.del

  // for now support only express@4
  if (!isVersion4) {
    debug.warn('express', 'version is not supported, not wrapping error handler')
    return express
  }

  var errorHandlerLayer
  function expressErrorHandler (error, request, response, next) {
    var briefcase = agent.storage.get('tracer.briefcase')
    agent.tracer.collector.userSentError(briefcase, 'express_error', error)
    next(error)
  }

  // in express errorhandlers have 4 arguments
  function isErrorHandler (middleware) {
    return middleware && middleware.handle && middleware.handle.length === 4
  }

  // it will be called every time a middleware is added to express
  // in these cases we remove our expressErrorHandler and add it later with addErrorHandler
  function removeErrorHandler (app) {
    var i
    if (app.stack && app.stack.length) {
      for (i = app.stack.length - 1; i >= 0; i -= 1) {
        if (app.stack[i] === errorHandlerLayer) {
          app.stack.splice(i, 1)
          break
        }
      }
    }
  }

  // look for the error handler provided by user, if found insert right before
  // if not found insert to the end
  function addErrorHandler (app) {
    var errorMiddlewareFound = false
    var i

    for (i = 0; i < app.stack.length; i++) {
      var middleware = app.stack[i]
      if (isErrorHandler(middleware)) {
        app.stack.splice(i, 0, errorHandlerLayer)
        errorMiddlewareFound = true
        break
      }
    }

    if (!errorMiddlewareFound) {
      app.stack.push(errorHandlerLayer)
    }
  }

  Shimmer.wrap(express.Router, 'use', function (original) {
    return function () {
      // magic to create an express layer from the error handler function
      if (!errorHandlerLayer) {
        errorHandlerLayer = original
          .call(this, '/', expressErrorHandler)
          .stack.pop()
      }
      removeErrorHandler(this)
      var app = original.apply(this, arguments)
      addErrorHandler(this)
      return app
    }
  })

  return express
}
