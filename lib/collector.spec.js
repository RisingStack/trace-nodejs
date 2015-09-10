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

  it('reports', function () {

    var traceId = '123';
    var data = 'data';

    var createNamespace = require('continuation-local-storage').createNamespace;
    var session = createNamespace('trace');

    var collector = new Collector({
      service: 'aladdin'
    });

    session.run(function () {

      session.set('request-id', traceId);

      collector.report(data);
    });

    expect(collector.partials[traceId].events[0].data).to.eql(data);
  });

  describe('events', function () {

    it('stores the "ClientReceive" events w/ `x-span-id`', function () {
      var collector = new Collector({});

      collector.setService('aladdin');

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/apple';
      var spanId = 'asdf';
      var headers = {
        'x-span-id': spanId
      };

      collector.onClientReceive({
        id: id,
        url: '/fruits/apple',
        time: time,
        host: 'localhost:3000',
        statusCode: 301,
        headers: headers
      });

      expect(collector.partials).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          host: 'localhost:3000',
          events: [
            {
              statusCode: 301,
              id: spanId,
              time: time,
              type: 'cr',
              data: undefined
            }
          ]
        }
      });
    });

    it('stores the "ClientSend" events w/ `x-span-id`', function () {
      var collector = new Collector({});

      collector.setService('aladdin');

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';
      var spanId = 'asdf';
      var headers = {
        'x-span-id': spanId
      };

      collector.onClientSend({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000',
        headers: headers
      });

      expect(collector.partials).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          host: 'localhost:3000',
          events: [
            {
              id: spanId,
              time: time,
              type: 'cs'
            }
          ]
        }
      });
    });

    it('stores the "ServerRecieve" events with no parent and timing data', function () {
      var collector = new Collector({});

      collector.setService('aladdin');

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';
      var spanId = 'asdf';
      var headers = {
        'x-span-id': spanId
      };

      collector.onServerReceive({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000',
        headers: headers
      });

      expect(collector.partials).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          origin: undefined,
          parent: undefined,
          host: 'localhost:3000',
          events: [
            {
              id: spanId,
              time: time,
              type: 'sr'
            }
          ]
        }
      });
    });

    it('stores the "ServerRecieve" events with parent and timing data', function () {
      var collector = new Collector({});

      collector.setService('aladdin');

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';

      var spanId = 'asdf';
      var origin = '12312312';
      var parent = '1';
      var headers = {
        'x-span-id': spanId,
        'x-client-send': origin,
        'x-parent': parent
      };

      collector.onServerReceive({
        id: id,
        url: '/fruits/pear',
        time: time,
        headers: headers,
        host: 'localhost:3000'
      });

      expect(collector.partials).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          origin: origin,
          host: 'localhost:3000',
          parent: parent,
          events: [
            {
              id: spanId,
              time: time,
              type: 'sr'
            }
          ]
        }
      });
    });

    it('stores the "ServerSend" events when it is not sampled', function () {
      var collector = new Collector({});

      collector.setService('aladdin');

      collector.setSampled(false);

      var time = 12345324953;
      var id = '1235';
      var headers = {};

      collector.onServerSend({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000',
        headers: headers
      });

      expect(collector.partials[id]).to.be.not.ok;
    });

    it('stores the "ServerSend" events when it is sampled', function (done) {

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';
      var service = 'aladdin';
      var spanId = 'asdf';
      var headers = {
        'x-span-id': spanId
      };
      var host = 'localhost';

      var collector = new Collector({});

      collector.setService(service);

      collector.setSampled(true);

      collector.onServerSend({
        id: id,
        statusCode: 301,
        url: '/fruits/pear',
        time: time,
        headers: headers,
        host: host
      });

      expect(collector.traces).to.eql([{
        span: url,
        host: host,
        trace: id,
        service: service,
        statusCode: 301,
        events: [{
          id: spanId,
          type: 'ss',
          time: time
        }]
      }]);

      done();
    });
  });
});
