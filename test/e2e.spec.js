var express = require('express');
var supertest = require('supertest');
var expect = require('chai').expect;
var serviceId = 1;

var seetru = require('../lib')({
  app: 'Users',
  service: serviceId
});

describe.skip('The collector', function () {

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
