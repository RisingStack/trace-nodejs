var http = require('http');
var fs = require('fs');
var path = require('path');

var createNamespace = require('continuation-local-storage').createNamespace;
var session = createNamespace('seetru');

var Collector = require('./collector');
var Shimmer = require('./Shimmer');

var HEADER_NAME = 'request-id';

/*
 * @method seetru
 */
function seetru (options) {

  var collector = new Collector(options);

  Shimmer.wrap(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'], function (addListener) {
    return function (type, listener) {
      if (type === 'request' && typeof listener === 'function') {
        return addListener.call(this, type,
          session.bind(require('./wraps/http.Server.prototype.js')(listener, collector)));
      } else {
        return addListener.apply(this, arguments);
      }
    };
  });

  Shimmer.wrap(http, 'http', 'request', function (original) {
    return require('./wraps/http.request')(original, collector);
  });

  process._fatalException = function (err) {
    var requestId = session.get(HEADER_NAME);

    fs.writeFileSync(path.join(__dirname, '../seetru.log'), JSON.stringify({
      id: requestId,
      stack: err.stack
    }) + '\n', {flag: 'a'});
  };
}

module.exports = seetru;
