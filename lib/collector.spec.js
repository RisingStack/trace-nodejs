/* jshint expr:true */

var Collector = require('./collector');
var expect = require('chai').expect;

var fs = require('fs');
var sinon = require('sinon');

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
        time: time,
        host: 'localhost:3000',
        statusCode: 301
      });

      expect(collector.store).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          host: 'localhost:3000',
          statusCode: 301,
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
        time: time,
        host: 'localhost:3000'
      });

      expect(collector.store).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          host: 'localhost:3000',
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
        time: time,
        host: 'localhost:3000'
      });

      expect(collector.store).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          origin: undefined,
          parent: undefined,
          host: 'localhost:3000',
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
        seetruData: seetruData,
        host: 'localhost:3000'
      });

      expect(collector.store).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          origin: origin,
          host: 'localhost:3000',
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

    it('stores the "ServerSend" events when it is not sampled', function () {
      var collector = new Collector({
        service: 'aladdin'
      });

      collector.setSampled(false);

      var time = 12345324953;
      var id = '1235';

      collector.onServerSend({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000'
      });

      expect(collector.store[id]).to.be.not.ok;
    });

    it('stores the "ServerSend" events when it is sampled', function (done) {

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';
      var service = 'aladdin';

      var fsStub = sinon.stub(fs, 'writeFile', function (path, data, options) {

        fsStub.restore();

        data = data.substring(0, data.length - 2);
        data = JSON.parse(data);

        expect(data).to.eql({
          span: url,
          trace: id,
          service: service,
          events: [{
            type: 'ss',
            time: time
          }]
        });

        expect(options).to.eql({
          flag: 'a'
        });
        done();
      });

      var collector = new Collector({
        service: service
      });

      collector.setSampled(true);

      collector.onServerSend({
        id: id,
        url: '/fruits/pear',
        time: time
      });
    });

  });

});
