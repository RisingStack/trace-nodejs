var http = require('http');
var https = require('https');

var Shimmer = require('./Shimmer');
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

  thirdParty.instrument();
}

module.exports.instrument = instrument;
