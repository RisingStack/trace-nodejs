'use strict'

var expect = require('chai').expect
var exponentialRetry = require('./exponentialRetry')

describe('exponentialRetry', function () {
  it('shouldn\'t retry successful task', function (done) {
    function task (cb) {
      return cb(null, 'ok')
    }
    var spy = this.sandbox.spy(task)
    exponentialRetry(spy, function (err, res) {
      if (err) {
        return done(err)
      }
      expect(res).to.eql('ok')
      expect(spy).to.have.been.calledOnce
      done()
    })
  })
  it('should retry once', function (done) {
    function task (cb) {
      return cb(new Error())
    }
    var spy = this.sandbox.spy(task)
    exponentialRetry(
      { maxRetries: 1 },
      spy,
      function (err, res) {
        expect(err).to.exist
        expect(spy).to.have.been.calledTwice
        done()
      })
  })
  it('should back off exponentially', function (done) {
    var count = 0
    this.sandbox.stub(global, 'setTimeout').callsFake(function (cb, int) {
      switch (count) {
        case 0: expect(int).to.eql(2); break
        case 1: expect(int).to.eql(7); break
        case 2: expect(int).to.eql(20); break
        case 3: expect(int).to.eql(54); break
        case 4: expect(int).to.eql(148); break
      }
      count++
      return process.nextTick(cb)
    })
    function task (cb) {
      return cb(new Error())
    }
    exponentialRetry(
      { maxRetries: 5 },
      task,
      function (err, res) {
        expect(setTimeout).to.have.callCount(5)
        expect(err).to.exist
        done()
      })
  })
  it('should accept errorFilter', function (done) {
    var spy = this.sandbox.spy(function (cb) {
      return cb(new Error())
    })
    exponentialRetry(
      {
        maxRetries: 5,
        errorFilter: function (err) { // eslint-disable-line handle-callback-err
          return false // shortcut retrial
        }
      },
      spy,
      function (err, res) {
        expect(spy).to.be.calledOnce
        expect(err).to.exist
        done()
      })
  })
  it('should accept custom maximum interval', function (done) {
    var count = 0
    this.sandbox.stub(global, 'setTimeout').callsFake(function (cb, int) {
      switch (count) {
        case 0: expect(int).to.eql(2); break
        case 1: expect(int).to.eql(7); break
        case 2: expect(int).to.eql(10); break
        case 3: expect(int).to.eql(10); break
        case 4: expect(int).to.eql(10); break
      }
      count++
      return process.nextTick(cb)
    })
    function task (cb) {
      return cb(new Error())
    }
    exponentialRetry(
      {
        maxRetries: 5,
        maxWait: 10
      },
      task,
      function (err, res) {
        expect(setTimeout).to.have.callCount(5)
        expect(err).to.exist
        done()
      })
  })
  it('should add error', function (done) {
    var count = 0
    this.sandbox.stub(global, 'setTimeout').callsFake(function (cb, int) {
      switch (count) {
        case 0: expect(int).to.eql(2); break
        case 1: expect(int).to.eql(7); break
        case 2: expect(int).to.eql(10); break
        case 3: expect(int).to.eql(10); break
        case 4: expect(int).to.eql(10); break
      }
      count++
      return process.nextTick(cb)
    })
    function task (cb) {
      return cb(new Error())
    }
    exponentialRetry(
      {
        maxRetries: 5,
        maxWait: 10
      },
      task,
      function (err, res) {
        expect(setTimeout).to.have.callCount(5)
        expect(err).to.exist
        done()
      })
  })
})
