'use strict'
function Event (id, obj) {}

// This method derives a locally unique id for the given event,
// based on the event's timestamp and clock sequence.
// The problem is with performance, we could easily concatenate
// the two as strings to create an id, however this is slow.
// Instead derive the id by using solely number operations
Event.getLocallyUniqueId = function (event) {
  // first 34 bits are enough for almost 2 weeks
  // clockseq is 16bit
  return (event.i % 0x0003ffffffff) * 0xffff + event.x
}

Event.types = {
  CLIENT_SEND: 'cs',
  SERVER_SEND: 'ss',
  CLIENT_RECV: 'cr',
  SERVER_RECV: 'sr',
  ERROR: 'err',
  USER_SENT: 'us'
}

Event.errorTypes = {
  USER_SENT: 'user-sent-error',
  NETWORK: 'network-error',
  SYSTEM: 'system-error'
}

module.exports = Event
