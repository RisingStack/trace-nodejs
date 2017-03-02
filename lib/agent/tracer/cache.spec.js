'use strict'
var expect = require('chai').expect
var Cache = require('./cache')
var sinon = require('sinon')

describe('Cache', function () {
  var options = {
    mustCollectSeverity: 3,
    ttl: 1
  }
  describe('merge', function () {
    it('should create event', function () {
      var cache = new Cache(options)
      var event = {
        type: 'sr'
      }
      cache.merge(['comm-id'], [event])
      expect(cache.get(['comm-id'])).to.have.members([event])
    })
    it('should append event to path', function () {
      var cache = new Cache(options)
      var event = {
        type: 'sr'
      }
      var event2 = {
        type: 'cs'
      }
      cache.merge(['comm-id'], [event])
      cache.merge(['comm-id-1', 'comm-id'], [event2, event])
      expect(cache.get(['comm-id'])).to.have.members([event, event2])
    })

    it('creates two different paths', function () {
      var cache = new Cache(options)
      var event = {
        type: 'sr'
      }
      var event2 = {
        type: 'cs'
      }
      cache.merge(['comm-id'], [event])
      cache.merge(['comm-id-1'], [event2])
      expect(cache.get(['comm-id'])).to.have.members([event])
      expect(cache.get(['comm-id-1'])).to.have.members([event2])
    })
  })
  describe('flush', function () {
    it('should discard event without returning them because of low severity', function () {
      var cache = new Cache(options)
      var event = {
        type: 'sr'
      }
      cache.merge(['comm-id'], [event])
      expect(cache.flush([])).to.have.members([])
      expect(cache.get(['comm-id'])).to.have.members([])
    })

    it('should discard events without returning them because of low severity', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event2 = { type: 'cs' }
      cache.merge(['comm-id-1', 'comm-id'], [event2, event])
      expect(cache.flush([])).to.have.members([])
      expect(cache.get(['comm-id'])).to.have.members([])
    })

    it('should work on subtree only', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event2 = { type: 'cs' }
      cache.merge(['comm-id'], [event])
      cache.merge(['comm-id-1'], [event2])
      expect(cache.flush(['comm-id'])).to.have.members([])
      expect(cache.get(['comm-id-1'])).to.have.members([event2])
    })

    it('should return elements if the path has high severity', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event2 = { type: 'cs' }
      cache.merge(['comm-id'], [event], options.mustCollectSeverity - 1)
      cache.merge(['comm-id-1'], [event2])
      expect(cache.flush(['comm-id'])).to.have.members([event])
      expect(cache.get(['comm-id-1'])).to.have.members([event2])
    })

    it('should discard subtree only #2', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event2 = { type: 'cs' }
      cache.merge(['comm-id-1', 'comm-id'], [event2, event])
      expect(cache.flush(['comm-id-1', 'comm-id'])).to.have.members([])
      expect(cache.get(['comm-id'])).to.have.members([event])
    })

    it('should return subtree only #2', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event2 = { type: 'cs' }
      cache.merge(['comm-id-1', 'comm-id'], [event2, event], options.mustCollectSeverity - 1)
      expect(cache.flush(['comm-id-1', 'comm-id'])).to.have.members([event2])
      expect(cache.get(['comm-id'])).to.have.members([event])
    })

    it('should not affect locked subtree', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event2 = { type: 'cs' }
      var event3 = { type: 'err' }
      cache.merge(['comm-id-1', 'comm-id'], [event2, event])
      cache.lock(['comm-id-1', 'comm-id'])
      cache.merge(['event-id', 'comm-id'], [event3, event], options.mustCollectSeverity - 1)
      expect(cache.flush(['comm-id'])).to.have.members([])
      expect(cache.get(['comm-id'])).to.have.members([event, event2, event3])
    })

    it('should flush unlocked subtree', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event2 = { type: 'cs' }
      var event3 = { type: 'err' }
      cache.merge(['comm-id-1', 'comm-id'], [event2, event])
      cache.lock(['comm-id-1', 'comm-id'])
      cache.merge(['event-id', 'comm-id-1', 'comm-id'], [event3, event2, event], options.mustCollectSeverity - 1)
      cache.unlock(['comm-id-1', 'comm-id'])
      expect(cache.flush(['comm-id'])).to.have.members([event, event2, event3])
      expect(cache.get(['comm-id'])).to.have.members([])
    })

    it('should flush unlocked subtree having multiple concurrent locks, if all unlocked', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event2 = { type: 'cs' }
      var event3 = { type: 'err' }
      var event4 = { type: 'ss' }
      cache.merge(['comm-id'], [event])
      cache.lock(['comm-id'])
      cache.merge(['comm-id-1', 'comm-id'], [event2, event])
      cache.lock(['comm-id-1', 'comm-id'])
      cache.merge(['ss-id'], [event4, event])
      cache.unlock(['comm-id'])
      cache.merge(['event-id', 'comm-id-1', 'comm-id'], [event3, event2, event], options.mustCollectSeverity - 1)
      expect(cache.flush(['comm-id'])).to.have.members([])
      cache.unlock(['comm-id-1', 'comm-id'])
      expect(cache.flush(['comm-id'])).to.have.members([event, event2, event3])
      expect(cache.get(['comm-id'])).to.have.members([])
    })

    it('flushing from parent works', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event2 = { type: 'cs' }
      var event3 = { type: 'err' }
      cache.merge(['3', '2', '1'], [event3, event2, event], options.mustCollectSeverity)
      cache.lock(['2', '1'])
      cache.unlock(['3', '2', '1'])
      expect(cache.flush(['1'])).to.have.members([event3, event2, event])
      expect(cache.get(['comm-id'])).to.have.members([])
    })
  })

  describe('Timing related', function () {
    var clock
    beforeEach(function () {
      clock = sinon.useFakeTimers()
    })
    afterEach(function () {
      clock.restore()
    })

    it('path should be expired', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      cache.merge(['comm-id'], [event])
      clock.tick(options.ttl)
      cache.flushExpiredChildren([])
      expect(cache.get([])).to.have.members([])
    })

    it('path should be expired and returned', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      cache.merge(['comm-id'], [event], options.mustCollectSeverity)
      clock.tick(options.ttl)
      expect(cache.flushExpiredChildren([])).to.have.members([event])
      expect(cache.get([])).to.have.members([])
    })

    it('path should be expired locking does not affect', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      cache.merge(['comm-id'], [event], options.mustCollectSeverity)
      cache.lock(['comm-id'])
      clock.tick(options.ttl)
      cache.flushExpiredChildren([])
      expect(cache.get([])).to.have.members([])
    })
    it('path should not be expired', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      cache.merge(['comm-id'], [event], options.mustCollectSeverity)
      clock.tick(options.ttl)
      cache.merge(['comm-id', 'comm-id-1'], [event, event], options.mustCollectSeverity)
      cache.flushExpiredChildren([])
      expect(cache.get([])).to.have.members([event, event])
    })
    it('one path should remain', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event1 = { type: 'cs' }
      cache.merge(['comm-id'], [event], options.mustCollectSeverity)
      clock.tick(options.ttl)
      cache.merge(['comm-id-1'], [event1], options.mustCollectSeverity)
      cache.flushExpiredChildren([])
      expect(cache.get([])).to.have.members([event1])
    })
    it('path head should remain', function () {
      var cache = new Cache(options)
      var event = { type: 'sr' }
      var event1 = { type: 'cs' }
      cache.merge(['comm-id', 'a'], [event, event1], options.mustCollectSeverity)
      clock.tick(options.ttl)
      cache.flushExpiredChildren(['a'])
      expect(cache.get([])).to.have.members([event1])
    })
  })
})
