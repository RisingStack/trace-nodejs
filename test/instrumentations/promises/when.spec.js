'use strict'
require('../test-setup.spec.js')
var expect = require('chai').expect
var Storage = require('@risingstack/trace/lib/agent/storage')

describe('when', function () {
  it('retains context', function (done) {
    var when = require('when')

    var storage = new Storage()

    storage.bind(usePromise)

    function createPromise () {
      storage.set('x', 5)
      return when.resolve()
    }

    function usePromise (promise) {
      promise.then(function () {
        expect(storage.get('x')).to.eql(5)
        storage.set('x', 6)
      }).then(function () {
        expect(storage.get('x')).to.eql(6)
        storage.set('x', 7)
        throw new Error()
      }).catch(function (err) { // eslint-disable-line handle-callback-err
        try {
          expect(storage.get('x')).to.eql(7)
          done()
        } catch (error) {
          done(error)
        }
      })
    }

    storage.bind(function () {
      usePromise(createPromise())
    })()
  })

  it('retains context with setTimeout', function (done) {
    var storage = new Storage()

    storage.bind(function () {
      return new when.Promise(function (resolve) {
        setTimeout(function () {
          storage.set('x', 5)
          resolve()
        })
      }).then(function () {
        expect(storage.get('x')).to.eql(5)
        done()
      })
    })()
  })
})
