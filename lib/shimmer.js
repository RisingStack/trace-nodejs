// from: https://github.com/othiym23/shimmer

'use strict';

function isFunction(funktion) {
  return funktion && {}.toString.call(funktion) === '[object Function]';
}

// Default to complaining loudly when things don't go according to plan.
var logger = console.error.bind(console);

// Keep initialization idempotent.
function shimmer(options) {
  if (options && options.logger) {
    if (!isFunction(options.logger)) {
      logger('new logger isn\'t a function, not replacing');
    } else {
      logger = options.logger;
    }
  }
}

function wrap(nodule, noduleName, methods, wrapper) {
  if (!methods) {
    return console.log('Must include a method name to wrap');
  }

  if (!noduleName) {
    noduleName = '[unknown]';
  }
  if (!Array.isArray(methods)) {
    methods = [methods];
  }

  methods.forEach(function (method) {
    var fqmn = noduleName + '.' + method;

    if (!nodule) {
      return;
    }
    if (!wrapper) {
      return;
    }

    var original = nodule[method];

    if (!original) {
      return console.log('%s not defined, so not wrapping.', fqmn);
    }
    if (original.__NR_unwrap) {
      return console.log('%s already wrapped by agent.', fqmn);
    }

    var wrapped = wrapper(original, method);
    wrapped.__NR_original = original;
    wrapped.__NR_unwrap = function __NR_unwrap() {
      nodule[method] = original;
      console.log('Removed instrumentation from %s.', fqmn);
    };

    nodule[method] = wrapped;
    console.log('Instrumented %s.', fqmn);
  });
}

function unwrap(nodule, noduleName, method) {
  if (!noduleName) {
    noduleName = '[unknown]';
  }
  if (!method) {
    return;
  }

  if (!nodule) {
    return;
  }
  var wrapped = nodule[method];

  if (!wrapped) {
    return;
  }
  if (!wrapped.__NR_unwrap) {
    return;
  }

  wrapped.__NR_unwrap();
}

shimmer.wrap = wrap;
shimmer.unwrap = unwrap;

module.exports = shimmer;
