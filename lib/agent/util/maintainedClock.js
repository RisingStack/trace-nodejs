'use strict'
var randomBytes = require('crypto').randomBytes
var microtime = require('../../optionalDependencies/@risingstack/microtime')

var uInt16Limit = 65536

// tries to make time a reliable source of uniqueness by maintaining a
// clock sequence that is changed when the a clock is either set back or a
// duplicate timestamp is detected
// this is mainly useful for generating uuid v1 ids
// see https://www.ietf.org/rfc/rfc4122.txt

// for application-wide uniqueness, don't create separate timers, use the global
// one instead
function create (seed, previousTime) {
  var clockSeq = seed == null
    ? randomBytes(2).readUInt16LE()
    : seed % uInt16Limit

  return function () {
    var currentTime = microtime.now()
    var dt
    if (previousTime != null) { // a previous timestamp exists
      dt = currentTime - previousTime
      if (dt <= 0) {
        clockSeq = (clockSeq + 1) % uInt16Limit
      }
    }
    previousTime = currentTime
    return [currentTime, clockSeq]
  }
}

module.exports = {
  create: create,
  global: create(randomBytes(2).readUInt16LE())
}
