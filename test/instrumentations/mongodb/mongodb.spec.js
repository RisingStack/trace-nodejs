'use strict'
var wrapper = require('@risingstack/trace/lib/instrumentations/mongodb').instrumentations[ 0 ].post
var COLLECTION_OPERATIONS = require('@risingstack/trace/lib/instrumentations/mongodb')._COLLECTION_OPERATIONS
var utils = require('@risingstack/trace/lib/instrumentations/utils')
var shimmer = require('@risingstack/trace/lib/utils/shimmer.js')

var expect = require('chai').expect
var mongodb = require('mongodb')
require('../test-setup.spec.js')

var url = 'mongodb://localhost:27017/trace-collector-test'

describe('mongo module wrapper', function () {
  var fakeAgent

  beforeEach(function () {
    fakeAgent = {
      incomingEdgeMetrics: {
        report: this.sandbox.spy()
      },
      tracer: {
        collector: {
          mustCollectSeverity: 9,
          defaultSeverity: 0,
          clientRecv: this.sandbox.spy(),
          clientSend: this.sandbox.stub().returns({
            briefcase: {
              csCtx: {
                communicationId: 1
              }
            },
            duffelBag: {
              timestamp: 0
            }
          })
        }
      },
      storage: {
        get: this.sandbox.spy()
      },
      externalEdgeMetrics: {
        report: this.sandbox.spy(),
        EDGE_STATUS: {
          OK: 1,
          NOT_OK: 0
        }
      }
    }
  })

  afterEach(function (done) {
    shimmer.unwrap(mongodb.Collection.prototype, COLLECTION_OPERATIONS)
    mongodb.MongoClient.connect(url)
      .then(function (db) {
        return db.collection('documents')
          .deleteMany({ foo: 'bar' })
      })
      .then(function () {
        done()
      })
      .catch(function (err) {
        done(err)
      })
  })

  describe('callback api', function () {
    it('should call original with provided arguments', function (done) {
      var originalSpy = this.sandbox.spy(mongodb.Collection.prototype, 'insertOne')
      var wrappedMongo = wrapper(mongodb, fakeAgent)

      var url = 'mongodb://localhost:27017/trace-collector-test'

      wrappedMongo.MongoClient.connect(url, function (err, db) {
        if (err) {
          return done(err)
        }
        var collection = db.collection('documents')
        collection.insertOne({ foo: 'bar' }, {}, function (err) {
          if (err) {
            return done(err)
          }

          expect(originalSpy.args[ 0 ][ 0 ]).to.include({ foo: 'bar' })
          expect(originalSpy.args[ 0 ][ 1 ]).to.eql({})
          expect(originalSpy.args[ 0 ][ 2 ]).to.be.a('function')

          done()
        })
      })
    })

    it('should let original call provided callback', function (done) {
      var wrappedMongo = wrapper(mongodb, fakeAgent)
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')

      var url = 'mongodb://localhost:27017/trace-collector-test'

      wrappedMongo.MongoClient.connect(url, function (err, db) {
        if (err) {
          return done(err)
        }
        var collection = db.collection('documents')
        collection.insertOne({ foo: 'bar' }, {}, function (err) {
          if (err) {
            return done(err)
          }
          // if callback is not called the test timeouts
          done()
        })
        expect(wrapQuerySpy).to.be.called
      })
    })

    it('should let original call provided callback when no options are passed', function (done) {
      var wrappedMongo = wrapper(mongodb, fakeAgent)
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')

      var url = 'mongodb://localhost:27017/trace-collector-test'

      wrappedMongo.MongoClient.connect(url, function (err, db) {
        if (err) {
          return done(err)
        }
        var collection = db.collection('documents')
        collection.insertOne({ foo: 'bar' }, {}, function (err) {
          if (err) {
            return done(err)
          }
          // if callback is not called the test timeouts
          done()
        })
        expect(wrapQuerySpy).to.be.called
      })
    })

    it('should call aggregate callback if below 2.0.0 and no cursor descriptor is provided', function (done) {
      var wrappedMongo = wrapper(mongodb, fakeAgent)
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')

      var url = 'mongodb://localhost:27017/trace-collector-test'

      wrappedMongo.MongoClient.connect(url, function (err, db) {
        if (err) {
          return done(err)
        }
        var collection = db.collection('documents')
        collection.insert({ foo: 'bar' }, function (err) {
          if (err) {
            done(err)
          }
          collection.aggregate([ { $match: { foo: 'bar' } }, {
            $project: {
              _id: 0,
              foo: 1
            }
          } ], {}, function (err, docs) {
            if (err) {
              return done(err)
            }
            expect(docs).to.eql([ { foo: 'bar' } ])
            done()
          })
        })

        expect(wrapQuerySpy).to.be.called
      })
    })

    it('should call aggregate callback if above 2.0.0 and a callback is provided', function (done) {
      var wrappedMongo = wrapper(mongodb, fakeAgent, { version: '2.0.0' })
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')

      var url = 'mongodb://localhost:27017/trace-collector-test'

      wrappedMongo.MongoClient.connect(url, function (err, db) {
        if (err) {
          return done(err)
        }
        var collection = db.collection('documents')
        collection.insert({ foo: 'bar' }, function (err) {
          if (err) {
            done(err)
          }
          collection.aggregate([ { $match: { foo: 'bar' } }, {
            $project: {
              _id: 0,
              foo: 1
            }
          } ], {}, function (err, docs) {
            if (err) {
              return done(err)
            }
            expect(docs).to.eql([ { foo: 'bar' } ])
            done()
          })
        })

        expect(wrapQuerySpy).to.be.called
      })
    })
  })

  describe('promise api', function () {
    it('should call original with provided arguments', function (done) {
      var originalSpy = this.sandbox.spy(mongodb.Collection.prototype, 'insertOne')
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')
      var wrappedMongo = wrapper(mongodb, fakeAgent, { version: '2.0.0' })

      var url = 'mongodb://localhost:27017/trace-collector-test'

      wrappedMongo.MongoClient.connect(url)
        .then(function (db) {
          var collection = db.collection('documents')
          collection.insertOne({ foo: 'bar' }, {})
          expect(wrapQuerySpy).to.be.called
          expect(originalSpy.args[ 0 ][ 0 ]).to.include({ foo: 'bar' })
          expect(originalSpy.args[ 0 ][ 1 ]).to.eql({})
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('should let original return Promise', function (done) {
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')
      var wrappedMongo = wrapper(mongodb, fakeAgent, { version: '2.0.0' })

      var url = 'mongodb://localhost:27017/trace-collector-test'

      wrappedMongo.MongoClient.connect(url)
        .then(function (db) {
          var collection = db.collection('documents')
          var insertPromise = collection.insertOne({ foo: 'bar' })
          expect(wrapQuerySpy).to.be.called
          expect(insertPromise).to.be.a('promise')
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })
  })

  describe('stream api', function () {
    it('should call original with provided arguments', function (done) {
      var originalSpy = this.sandbox.spy(mongodb.Collection.prototype, 'find')
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')
      var wrappedMongo = wrapper(mongodb, fakeAgent, { version: '2.0.0' })

      wrappedMongo.MongoClient.connect(url)
        .then(function (db) {
          var collection = db.collection('documents')
          collection.find({ foo: 'bar' }, {})

          expect(wrapQuerySpy).to.be.called
          expect(originalSpy.args[ 0 ][ 0 ]).to.include({ foo: 'bar' })
          expect(originalSpy.args[ 0 ][ 1 ]).to.eql({})
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('should return a stream for find', function (done) {
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')
      var wrappedMongo = wrapper(mongodb, fakeAgent, { version: '2.0.0' })

      wrappedMongo.MongoClient.connect(url)
        .then(function (db) {
          var collection = db.collection('documents')
          var cursor = collection.find({ foo: 'bar' }, {})
          var Readable = require('stream').Readable
          expect(wrapQuerySpy).to.be.called
          expect(cursor instanceof Readable).to.be.true
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('should return a stream for aggregate if no callback is provided above 2.0.0', function (done) {
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')
      var wrappedMongo = wrapper(mongodb, fakeAgent, { version: '2.0.0' })

      wrappedMongo.MongoClient.connect(url)
        .then(function (db) {
          var collection = db.collection('documents')
          var cursor = collection.aggregate([ { $match: { foo: 'bar' } } ])
          var Readable = require('stream').Readable
          expect(wrapQuerySpy).to.be.called
          expect(cursor instanceof Readable).to.be.true
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('should return a stream for aggregate if cursor descriptor is provided below 2.0.0', function (done) {
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')
      var wrappedMongo = wrapper(mongodb, fakeAgent)

      wrappedMongo.MongoClient.connect(url)
        .then(function (db) {
          var collection = db.collection('documents')
          var cursor = collection.aggregate([ { $match: { foo: 'bar' } } ], { cursor: { batchSize: 1 } })
          var Readable = require('stream').Readable
          expect(wrapQuerySpy).to.be.called
          expect(cursor instanceof Readable).to.be.true
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('should let toArray work', function (done) {
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')
      var wrappedMongo = wrapper(mongodb, fakeAgent)
      var collection
      wrappedMongo.MongoClient.connect(url)
        .then(function (db) {
          collection = db.collection('documents')
          return collection.insertOne({ foo: 'bar' })
        })
        .then(function () {
          var cursor = collection.aggregate([ { $match: { foo: 'bar' } }, {
            $project: {
              _id: 0,
              foo: 1
            }
          } ], { cursor: { batchSize: 1 } })
          return cursor.toArray()
        })
        .then(function (docs) {
          expect(wrapQuerySpy).to.be.called
          expect(docs).to.be.eql([ { foo: 'bar' } ])
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('should not allow data loss', function (done) {
      var wrapQuerySpy = this.sandbox.spy(utils, 'wrapQuery')
      var wrappedMongo = wrapper(mongodb, fakeAgent, { version: '2.0.0' })

      wrappedMongo.MongoClient.connect(url)
        .then(function (db) {
          var collection = db.collection('documents')
          var cursor = collection.find({ foo: 'bar' }, {})

          var testList = []
          cursor.push({ foo: 'bar1' })
          cursor.on('data', function (data) {
            testList.push(data)
          })

          cursor.on('end', function () {
            expect(testList).to.eql([
              { foo: 'bar1' },
              { foo: 'bar2' }
            ])
          })

          cursor.push({ foo: 'bar2' })

          expect(wrapQuerySpy).to.be.called
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })
  })
})
