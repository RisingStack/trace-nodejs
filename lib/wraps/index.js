var http = require('http');
var stream = require('stream');

var getNamespace = require('continuation-local-storage').getNamespace;
var Shimmer = require('./shimmer');

function instrument (collector, config) {
  Shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./http.Server.prototype.js')(listener, collector, config));
        } else {
          return addListener.apply(this, arguments);
        }
      };
    });

  Shimmer.wrap(http, 'http', 'request', function (original) {
    return require('./http.request')(original, collector, config);
  });

  Shimmer.wrap(process, 'process', '_fatalException', function (original) {
    return require('./process._fatalException')(original, collector, config);
  });

  getNamespace('trace').bindEmitter(stream.prototype);
}

function uninstrument () {
  Shimmer.unwrap(http.Server.prototype, 'http.Server.prototype', 'addListener');
  Shimmer.unwrap(http.Server.prototype, 'http.Server.prototype', 'addListener');

  Shimmer.unwrap(http, 'http', 'request');

  Shimmer.unwrap(process, 'process', '_fatalException');
}

module.exports.instrument = instrument;
module.exports.uninstrument = uninstrument;
