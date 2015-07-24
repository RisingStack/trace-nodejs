var http = require('http');
var https = require('https');

var Shimmer = require('./shimmer');
var thirdParty = require('./third-party');

function instrument (collector) {
  Shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./http.Server.prototype.js')(listener, collector));
        } else {
          return addListener.apply(this, arguments);
        }
      };
    });

  Shimmer.wrap(https.Server.prototype, 'https.Server.prototype', ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./http.Server.prototype.js')(listener, collector));
        } else {
          return addListener.apply(this, arguments);
        }
      };
    });

  Shimmer.wrap(http, 'http', 'request', function (original) {
    return require('./http.request')(original, collector);
  });

  Shimmer.wrap(https, 'https', 'request', function (original) {
    return require('./http.request')(original, collector);
  });

  Shimmer.wrap(process, 'process', '_fatalException', function (original) {
    return require('./process._fatalException')(original, collector);
  });

  thirdParty.instrument();
}

function uninstrumentNatives (collector) {
  Shimmer.unwrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./http.Server.prototype.js')(listener, collector));
        } else {
          return addListener.apply(this, arguments);
        }
      };
    });

  Shimmer.unwrap(https.Server.prototype, 'https.Server.prototype', ['on', 'addListener'],
    function (addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type,
            require('./http.Server.prototype.js')(listener, collector));
        } else {
          return addListener.apply(this, arguments);
        }
      };
    });

  Shimmer.unwrap(http, 'http', 'request', function (original) {
    return require('./http.request')(original, collector);
  });

  Shimmer.unwrap(https, 'https', 'request', function (original) {
    return require('./http.request')(original, collector);
  });

  Shimmer.unwrap(process, 'process', '_fatalException', function (original) {
    return require('./process._fatalException')(original, collector);
  });
}

module.exports.instrument = instrument;
module.exports.uninstrumentNatives = uninstrumentNatives;
