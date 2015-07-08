var superagent = require('superagent');
var COLLECTOR_API_SAMPLE = 'http://seetru-collector-staging.herokuapp.com:80/service/sample';

function send (data, callback) {

  superagent
    .post(COLLECTOR_API_SAMPLE)
    .set('Authorization', 'Bearer ' + _this.apiKey)
    .send(data)
    .end(callback);
}

function create (options) {

  var apiKey = options.apiKey || process.env.RISINGTRACE_API_KEY;

  return {
    send: send
  };
}

module.exports.create = create;
