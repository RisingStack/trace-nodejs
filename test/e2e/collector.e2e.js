var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var merge = require('lodash/object/merge');
var find = require('lodash/collection/find');
var any = require('lodash/collection/any');
var async = require('async');
var request = require('superagent');
var expect = require('chai').expect;
var format = require('util').format;

var testConfig = require('./config');

var serviceNames = testConfig.services;

function shouldContainType (events, type) {
  var found = any(events, function (event) {
    return event.type === type;
  });

  expect(found).to.be.true;
}

describe('Trace module', function () {
  var collectorApiProcess;
  var apiKey;
  var spawnedProcesses = {};

  beforeEach(function (callback) {
    this.timeout(10000);

    var index = 1;
    function spawnProcesses(service, done) {
      var servicePath = path.join(__dirname, format('service%d/', index));

      apiKey = 'key';
      var env = merge({}, process.env, {
        SERVICE: index,
        PORT: testConfig.portBase + index,
        API_KEY: apiKey,
        TRACE_CONFIG_PATH: path.join(servicePath, 'trace.config.js'),
        COLLECTOR_API_URL: 'http://localhost:4000/',
        /* Allow self signed certs in tests */
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
        TRACE_LOGFILE_PATH: './'
      });

      var serviceConfig = require(env.TRACE_CONFIG_PATH);

      var spawned = spawn('node', ['--harmony', servicePath ], {
        env: env
      });

      spawned.stdout.once('data', function () {
        spawnedProcesses[service] = {
          process: spawned,
          env: env,
          config: serviceConfig
        };

        done();
      });

      spawned.once('error', done);

      /* For debugging purposes */
      spawned.stdout.pipe(process.stdout);
      spawned.stderr.pipe(process.stderr);

      index++;
    }

    /* Create processes */
    async.series([
      /* Collector-API process */
      function (done) {
        collectorApiProcess = spawn('node', ['--harmony', path.join(__dirname, './collectorApi') ]);

        collectorApiProcess.stdout.once('data', function () {
          done();
        });

        collectorApiProcess.once('error', done);

        /* For debugging purposes */
        collectorApiProcess.stdout.pipe(process.stdout);
        collectorApiProcess.stderr.pipe(process.stderr);
      },
      /* Webserver processes */
      function (done) {
        async.each(serviceNames, spawnProcesses, done);
      }
    ], callback);
  });

  afterEach(function () {
    Object.keys(spawnedProcesses).forEach(function (key) {
      process.kill(spawnedProcesses[key].process.pid);
    });

    process.kill(collectorApiProcess.pid);
  });

  it('should initialize within a second', function (done) {
    // TODO CLEAR
    setTimeout(function () {
      done();
    }, 1000);
  });

  it('should respond with a decorated response', function (done) {
    request
    .get('http://localhost:3001/')
    .end(function (err, res) {
      if (err) {
        return done(err);
      }

      expect(res.body).to.be.eql({
        message: 'success'
      });

      expect(res.headers['x-parent']).be.eql('1');
      expect(res.headers['x-client-send']).match(/\d{10,11}/);

      done();
    });
  });

  it('should write the requests to a file', function (done) {
    request
    .get('http://localhost:3001/')
    .end(function (err) {
      if (err) {
        return done(err);
      }

      var results = fs
        .readdirSync(path.resolve('./') + '/')
        .filter(function (path) {
          return path.match(/trace_\d*.log/);
        })
        .map(function (filePath) {
          return JSON.parse('[' + fs.readFileSync(filePath).toString().replace(/,\n$/, '') + ']');
        });

      // Find traces by service name

      // First service reportings
      var service1Trace1 = find(results, function (result) {
        return result[0].service === 1;
      })[0];

      expect(service1Trace1.span).to.be.eql('/');
      expect(service1Trace1.trace).to.match(/([A-Za-z_0-9]+-){4}[A-Za-z_0-9]+/);
      expect(service1Trace1.statusCode).to.be.eql(200);
      expect(service1Trace1.service).to.be.eql(1);
      expect(service1Trace1.events.length).to.be.eql(4);

      var clientRecieveEvent1 = find(service1Trace1.events, function (event) {
        return event.statusCode;
      });
      expect(clientRecieveEvent1.statusCode).to.be.eql(200);
      expect(clientRecieveEvent1.type).to.be.eql('cr');

      shouldContainType(service1Trace1.events, 'cs');
      shouldContainType(service1Trace1.events, 'cr');
      shouldContainType(service1Trace1.events, 'sr');
      shouldContainType(service1Trace1.events, 'ss');

      // Second service reportings
      var service2Trace1 = find(results, function (result) {
        return result[0].service === 2;
      })[0];

      expect(service2Trace1.span).to.be.eql('/');
      expect(service2Trace1.trace).to.match(/([A-Za-z_0-9]+-){4}[A-Za-z_0-9]+/);
      expect(service2Trace1.statusCode).to.be.eql(200);
      expect(service2Trace1.service).to.be.eql(2);

      /* This should not contain client recieve event */
      var clientRecieveEvent2 = find(service2Trace1.events, function (event) {
        return event.statusCode;
      });
      expect(clientRecieveEvent2).to.be.eql();

      shouldContainType(service2Trace1.events, 'sr');
      shouldContainType(service2Trace1.events, 'ss');

      done();
    });
  });
});

