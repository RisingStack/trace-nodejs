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

    it('stores the "ClientSend" events', function () {
      var collector = new Collector({
        service: 'aladdin'
      });

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';

      collector.onClientSend({
        id: id,
        url: '/fruits/pear',
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
              type: 'cs'
            }
          ]
        }
      });
    });

    it('stores the "ServerRecieve" events with no seetruData', function () {
      var collector = new Collector({
        service: 'aladdin'
      });

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';

      collector.onServerReceive({
        id: id,
        url: '/fruits/pear',
        time: time
      });

      expect(collector.store).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          spanId: url,
          origin: undefined,
          parent: undefined,
          events: [
            {
              time: time,
              type: 'sr'
            }
          ]
        }
      });
    });

    it('stores the "ServerRecieve" events with seetruData', function () {
      var collector = new Collector({
        service: 'aladdin'
      });

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';

      var origin = '12312312';
      var parent = '1';
      var seetruData = [origin, parent].join('-');

      collector.onServerReceive({
        id: id,
        url: '/fruits/pear',
        time: time,
        seetruData: seetruData
      });

      expect(collector.store).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          spanId: url,
          origin: origin,
          parent: parent,
          events: [
            {
              time: time,
              type: 'sr'
            }
          ]
        }
      });
    });

    /*
    it('stores the "ServerSend" events when it is not sampled', function () {
      var collector = new Collector({
        service: 'aladdin'
      });

      collector.sampleRate = 0;

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';

      collector.onServerSend({
        id: id,
        url: '/fruits/pear',
        time: time
      });

      expect(collector.store).to.eql({});
    });

    it('stores the "ServerSend" events when it is sampled', function () {
      var collector = new Collector({
        service: 'aladdin'
      });

      collector.sampleRate = 1;

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';

      collector.onServerSend({
        id: id,
        url: '/fruits/pear',
        time: time
      });

      console.log(collector)

      expect(collector.store).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          spanId: url,
          events: [
            {
              time: time,
              type: 'cs'
            }
          ]
        }
      });
    });
   */

  });

});
