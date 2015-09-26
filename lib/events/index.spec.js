var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;

var Events = require('./');

describe('The Events module', function () {

  it('can be created', function () {
    var events = Events.create();
    expect(events instanceof EventEmitter).to.be.ok;
    expect(events).to.be.ok;
  });

});
