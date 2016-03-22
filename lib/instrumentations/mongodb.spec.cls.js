'use strict'

var cls = require('continuation-local-storage')
var ns = cls.createNamespace('app')
var expect = require('chai').expect

describe('Mongodb-cls', function () {
  it('Model#save callback', function (done) {
    var MongoClient = require('mongodb').MongoClient
    var url = 'mongodb://localhost:27017/trace-collector-test'

    ns.run(function () {
      var value = Math.random()
      var key = 'Mongodb#insert'
      ns.set(key, value)
      MongoClient.connect(url, function (err, db) {
        if (err) {
          return done(err)
        }
        var collection = db.collection('documents')

        collection.insertMany([
          {
            a: 1
          }, {
            a: 2
          }
        ], function (err, result) {
          if (err) {
            return done(err)
          }
          expect(ns.get(key)).to.eql(value)
          db.close()
          done()
        })
      })
    })
  })
})
