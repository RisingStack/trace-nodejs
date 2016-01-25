'use strict'

var cls = require('continuation-local-storage')
var ns = cls.createNamespace('app')
var expect = require('chai').expect

var mongoose = require('mongoose')
var mongooseCls = require('./mongoose')

describe('Mongoose-cls', function () {
  var TestModel = mongoose.model('test_model', mongoose.Schema({
    value: String
  }))

  before(function (done) {
    mongooseCls(ns)
    mongoose.connect('mongodb://localhost/mongoose-cls-test', done)
  })

  after(function () {
    mongoose.disconnect()
  })

  it('Model#find callback', function (done) {
    ns.run(function () {
      var value = 'value'
      var key = 'Model#find-cb'
      ns.set(key, value)
      TestModel.find({}, function (err, data) {
        if (err) {
          return done(err)
        }
        expect(ns.get(key)).to.eql(value)
        done()
      })
    })
  })

  it('Model#find promise', function (done) {
    ns.run(function () {
      var value = 'value'
      var key = 'Model#find-promise'
      ns.set(key, value)
      var p = TestModel.find({}).exec()
      p.then(function () {
        expect(ns.get(key)).to.eql(value)
        done()
      })
    })
  })

  it('Model#save callback', function (done) {
    ns.run(function () {
      var value = 'value'
      var key = 'Model#find-callback'
      ns.set(key, value)
      var t = new TestModel({
        value: 'a'
      })
      t.save(function (err) {
        if (err) {
          return done(err)
        }
        expect(ns.get(key)).to.eql(value)
        done()
      })
    })
  })

  it('Model#remove callback', function (done) {
    ns.run(function () {
      var value = 'value'
      var key = 'Model#remove-callback'
      ns.set(key, value)
      TestModel.remove({}, function (err) {
        if (err) {
          return done(err)
        }
        expect(ns.get(key)).to.eql(value)
        done()
      })
    })
  })
})
