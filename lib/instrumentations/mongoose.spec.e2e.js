'use strict'

var expect = require('chai').expect
var freshy = require('freshy')

function getModel () {
  freshy.unload('mongoose')
  var mongoose = require('mongoose')

  var TestModel = mongoose.model('test_model', mongoose.Schema({
    value: String
  }))

  mongoose.connect('mongodb://localhost/mongoose-cls-test')

  return TestModel
}

describe('Mongoose-cls', function () {
  it('Model#find callback', function (done) {
    var ns = this.ns
    var TestModel = getModel()
    ns.run(function () {
      var value = Math.random()
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
    var TestModel = getModel()
    var ns = this.ns
    ns.run(function () {
      var value = Math.random()
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
    var TestModel = getModel()
    var ns = this.ns
    ns.run(function () {
      var value = Math.random()
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
    var TestModel = getModel()
    var ns = this.ns
    ns.run(function () {
      var value = Math.random()
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
