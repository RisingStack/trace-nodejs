var superagent = require('superagent');
var COLLECTOR_API_SAMPLE = 'http://seetru-collector-staging.herokuapp.com:80/service/sample';
var COLLECTOR_API_SERVICE = 'http://seetru-collector-staging.herokuapp.com:80/service';

function TraceReporter (options) {
  this.apiKey = options.apiKey || process.env.RISINGTRACE_API_KEY;
  this.appName = options.appName || process.env.RISINGTRACE_APP_NAME;

  //check if everything is ok with config
  if (!this.apiKey) {
    throw new Error('Missing apiKey');
  }

  if (!this.appName) {
    throw new Error('Missing appName');
  }
}

TraceReporter.prototype.send = function (data, callback) {
  superagent
    .post(COLLECTOR_API_SAMPLE)
    .set('Authorization', 'Bearer ' + this.apiKey)
    .send(data)
    .end(callback);
};

TraceReporter.prototype.getService = function(callback) {
  var _this = this;
  superagent
    .post(COLLECTOR_API_SERVICE)
    .set('Authorization', 'Bearer ' + _this.apiKey)
    .send({
      name: _this.appName
    })
    .end(function (err, res) {
      if (err && err.status === 409) {
        return _this.getService(callback);
      } else if (err) {
        return callback(err);
      }

      return callback(null, res.body);
    });
};

function create(options) {
  return new TraceReporter(options);
}

module.exports.create = create;
