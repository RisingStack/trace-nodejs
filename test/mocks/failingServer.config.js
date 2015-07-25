var config = {};

config.appName = '#fail';

function FailingServerTestReporter () {
  this.send = function (data, cb) {
    cb(null);
  };

  this.getService = function () {
    return config.appName;
  };
}

config.reporter = new FailingServerTestReporter();

module.exports = config;
