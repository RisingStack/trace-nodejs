var fs = require('fs');
var http = require('http');
var spawn = require('child_process').spawn;
var path = require('path');

var extend = require('lodash/object/extend');
var expect = require('chai').expect;

function startFailingServer () {
  var env = extend({}, process.env);
  env.TRACE_CONFIG_PATH = path.join(__dirname, '../../test/mocks', 'failingServer.config.js');

  var child = spawn('node', ['--harmony', 'test/mocks/failingServer.js'], {
    env: env
  });

  return child;
}

describe('The stacktrace wrapper module', function () {

  var spawned;

  after(function () {
    spawned.kill();
  });

  it('writes stacktrace into log file', function (done) {
    spawned = startFailingServer();

    spawned.stdout.on('data', function () {
      http
        .get('http://localhost:15124')
        .on('error', function (err) {
          expect(err.code).to.be.eq('ECONNRESET');

          var files = fs.readdirSync(path.join(__dirname, '../../', 'test/mocks'));

          var logFiles = files.filter(function (file) {
            return file.indexOf('trace_') > -1;
          });

          var LOGFILE_PATH = path.join(__dirname, '../../', 'test/mocks', logFiles[0]);

          fs.readFile(LOGFILE_PATH, 'utf-8', function (err, raw) {
            expect(err).to.be.not.ok;
            expect(raw).to.be.ok;

            var stacktrace = JSON.parse(raw.slice(0, -2)).events[0];

            expect(stacktrace.type).to.be.eq('st');

            var errMsg = 'Error: Very error';
            expect(stacktrace.data.trace.slice(0, errMsg.length)).to.be.eq(errMsg);
            done();
          });
        });
    });
  });

  it('reads the previous log files', function () {
    startFailingServer(true);
  });

});
