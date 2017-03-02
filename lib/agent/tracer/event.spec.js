'use strict'

var expect = require('chai').expect
var Event = require('./event')

describe('Event', function () {
  it('should create id', function () {
    var id1 = Event.getLocallyUniqueId({ i: 126002346983, x: 65535 })
    var id2 = Event.getLocallyUniqueId({ i: 126002346983, x: 0 })
    var id3 = Event.getLocallyUniqueId({ i: 0, x: 65535 })
    var id4 = Event.getLocallyUniqueId({ i: 0, x: 0 })
    expect(id1).to.not.eql(id2)
    expect(id1).to.not.eql(id3)
    expect(id1).to.not.eql(id4)
    expect(id2).to.not.eql(id3)
    expect(id2).to.not.eql(id4)
    expect(id3).to.not.eql(id4)
  })
})
