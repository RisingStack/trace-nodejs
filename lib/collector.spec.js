/* jshint expr:true */

var Collector = require('./collector');
var expect = require('chai').expect;

describe('The collector module', function () {

  it('exists', function () {
    expect(Collector).to.be.ok;
  });

  it('can be instantiated', function () {
    var collector = new Collector({});
    expect(collector).to.be.ok;
  });

  describe('events', function () {

    it('stores the "ClientReceive" events', function () {
      var collector = new Collector({
        service: 'aladdin'
      });

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/apple';

      collector.onClientReceive({
        id: id,
        url: '/fruits/apple',
        time: time
      });

      expect(collector.store).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          spanId: url,
          events: [
            {
              time: time,
              type: 'cr'
            }
          ]
        }
      });
    });

  });

});
