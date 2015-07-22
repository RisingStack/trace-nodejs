var Shimmer = require('../shimmer');
var getNamespace = require('continuation-local-storage').getNamespace;

function wrapSuperagent() {
  var session = getNamespace('trace');
  var superagent;

  try {
    superagent = require('superagent');
  } catch (ex) {
    return;
  }

  Shimmer.wrap(superagent.Request.prototype, 'superagent.Request.prototype', 'end',
    function (original) {
      return function (fn) {
        fn = session.bind(fn);

        return original.call(this, fn);
      };
    });
}

function wrapRequest() {
  var session = getNamespace('trace');
  var request;

  try {
    request = require('request');
  } catch (ex) {
    return;
  }

  session.bindEmitter(request.Request.prototype);
}

function instrument() {
  wrapSuperagent();
  wrapRequest();
}

module.exports.instrument = instrument;
