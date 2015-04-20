var express = require('express');
var supertest = require('supertest');
var async = require('async');

var getNamespace = require('continuation-local-storage').getNamespace;

var expect = require('chai').expect;
var serviceId = 1;

var seetru = require('../lib')({
  app: 'Users',
  service: serviceId
});

describe('The collector', function () {

  it('adds the request-id header to the server response', function (done) {

    var parent = express();
    var child = express();

    child.get('/risingstack', function (req, res) {
      expect(req.headers['request-id']).to.be.ok;
      res.send('ok');
    });

    parent.get('/test', function (req, res) {

      supertest(child)
        .get('/risingstack')
        .end(function (err, result) {
          if (err) {
            return done(err);
          }
          res.send('ok');
        });

    });

    supertest(parent)
      .get('/test')
      .end(done);

  });

  it('adds the request-id header to the server response every time called',
     function (done) {

    var source1 = express();
    var source2 = express();
    var destination = express();

    var storage = {};
    storage.source1 = [];
    storage.source2 = [];

    destination.get('/apple', function (req, res) {
      res.send('ok');
    });

    source1.get('/source1', function (req, res) {

      var session = getNamespace('seetru');
      var traceId = session.get('requestId');
      storage.source1.push(traceId);

      supertest(destination)
        .get('/apple')
        .end(function (err) {
          if (err) {
            return done(err);
          }

          var session = getNamespace('seetru');
          var traceId = session.get('requestId');
          storage.source1.push(traceId);

          res.send('ok');
        });
    });

    source2.get('/source2', function (req, res) {

      var session = getNamespace('seetru');
      var traceId = session.get('requestId');
      storage.source2.push(traceId);

      supertest(destination)
        .get('/apple')
        .end(function (err) {
          if (err) {
            return done(err);
         }
          var session = getNamespace('seetru');
          var traceId = session.get('requestId');
          storage.source2.push(traceId);

          res.send('ok');
        });
    });

    async.series([
      function pingSource1(cb) {
        supertest(source1)
          .get('/source1')
          .end(cb);
      },
      function pingSource2(cb) {
        supertest(source2)
          .get('/source2')
          .end(cb);
      }], function (err, result) {
        if (err) {
          return done(err);
        }

        console.log(storage)
        done();
      });
  });

  it('adds the x-seetrue header to the server response', function (done) {

    var parent = express();
    var child = express();

    child.get('/risingstack', function (req, res) {
      var seetruHeader = req.headers['x-seetru'];
      expect(seetruHeader).to.be.ok;
      expect(parseInt(seetruHeader.split('-')[1], 10)).to.be.equal(serviceId);
      res.send('ok');
    });

    parent.get('/test', function (req, res) {

      supertest(child)
        .get('/risingstack')
        .end(function (err, result) {
          if (err) {
            return done(err);
          }
          res.send('ok');
        });

    });

    supertest(parent)
      .get('/test')
      .end(done);

  });

});
