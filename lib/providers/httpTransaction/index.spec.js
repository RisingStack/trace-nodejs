/* jshint expr:true */
var expect = require('chai').expect;

var HttpTransaction = require('./');
var wraps = require('./wraps');

describe('The HttpTransaction module', function () {

  var eventBus = {
    on: function() {},
    emit: function () {}
  };

  beforeEach(function () {
    this.sandbox.stub(wraps, 'instrument', function () {

    });
  });

  it('exists', function () {
    expect(HttpTransaction).to.be.ok;
  });

  it('can be instantiated', function () {
    var httpTransaction = HttpTransaction.create(eventBus, {});
    expect(httpTransaction).to.be.ok;
  });

  it('reports', function () {

    var traceId = '123';
    var data = 'data';

    var createNamespace = require('continuation-local-storage').createNamespace;
    var session = createNamespace('trace');

    var httpTransaction = HttpTransaction.create(eventBus, {
      service: 'aladdin'
    });

    session.run(function () {

      session.set('request-id', traceId);

      httpTransaction.report(data);
    });

    expect(httpTransaction.partials[traceId].events[0].data).to.eql(data);
  });

  describe('events', function () {

    it('stores the "ClientReceive" events w/ `x-span-id`', function () {
      var httpTransaction = HttpTransaction.create(eventBus, {});

      httpTransaction.setService('aladdin');

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/apple';
      var spanId = 'asdf';
      var headers = {
        'x-span-id': spanId
      };
      var host = 'localhost:3000';

      httpTransaction.onClientReceive({
        id: id,
        spanId: spanId,
        url: url,
        time: time,
        host: host,
        statusCode: 301,
        headers: headers
      });

      expect(httpTransaction.partials).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          host: 'localhost:3000',
          events: [
            {
              statusCode: 301,
              id: spanId,
              url: url,
              host: host,
              time: time,
              type: 'cr',
              data: undefined
            }
          ]
        }
      });
    });

    it('stores the "ClientSend" events w/ `x-span-id`', function () {
      var httpTransaction = HttpTransaction.create(eventBus, {});

      httpTransaction.setService('aladdin');

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';
      var spanId = 'asdf';
      var headers = {
        'x-span-id': spanId
      };
      var method = 'GET';

      httpTransaction.onClientSend({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000',
        method: method,
        headers: headers
      });

      expect(httpTransaction.partials).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          host: 'localhost:3000',
          events: [
            {
              id: spanId,
              time: time,
              method: method,
              type: 'cs',
              url: '/fruits/pear',
              host: 'localhost:3000'
            }
          ]
        }
      });
    });

    it('stores the "ServerRecieve" events with no parent and timing data', function () {
      var httpTransaction = HttpTransaction.create(eventBus, {});

      httpTransaction.setService('aladdin');

      var time = 12345324953;
      var id = '1235';
      var url = '/fruits/pear';
      var spanId = 'asdf';
      var headers = {
        'x-span-id': spanId
      };
      var method = 'GET';

      httpTransaction.onServerReceive({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000',
        method: method,
        headers: headers
      });

      expect(httpTransaction.partials).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          origin: undefined,
          parent: undefined,
          method: method,
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
      var httpTransaction = HttpTransaction.create(eventBus, {});

      httpTransaction.setService('aladdin');

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
      var method = 'GET';

      httpTransaction.onServerReceive({
        id: id,
        url: '/fruits/pear',
        time: time,
        headers: headers,
        method: method,
        host: 'localhost:3000'
      });

      expect(httpTransaction.partials).to.eql({
        '1235': {
          trace: id,
          service: 'aladdin',
          span: url,
          origin: origin,
          host: 'localhost:3000',
          method: method,
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
      var httpTransaction = HttpTransaction.create(eventBus, {});

      httpTransaction.setService('aladdin');

      httpTransaction.sampleRate = 0;

      var time = 12345324953;
      var id = '1235';
      var headers = {};

      httpTransaction.onServerSend({
        id: id,
        url: '/fruits/pear',
        time: time,
        host: 'localhost:3000',
        headers: headers
      });

      expect(httpTransaction.partials[id]).to.be.not.ok;
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

      var httpTransaction = HttpTransaction.create(eventBus, {});

      httpTransaction.setService(service);

      httpTransaction.sampleRate = 1;

      httpTransaction.onServerSend({
        id: id,
        statusCode: 301,
        url: '/fruits/pear',
        time: time,
        headers: headers,
        host: host
      });

      expect(httpTransaction.traces).to.eql([{
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

      expect(httpTransaction.rpmMetrics).to.be.eql({
        301: 1
      });

      done();
    });

    it('\'ServerSend\' adds to existing rpmMetrics', function (done) {

      var time = 12345324953;
      var id = '1235';
      var service = 'aladdin';
      var spanId = 'asdf';
      var headers = {
        'x-span-id': spanId
      };
      var host = 'localhost';

      var metricsValue = 222;

      var httpTransaction = HttpTransaction.create(eventBus, {});

      httpTransaction.setService(service);

      httpTransaction.sampleRate = 1;
      httpTransaction.rpmMetrics = {
        301: metricsValue
      };

      httpTransaction.onServerSend({
        id: id,
        statusCode: 301,
        url: '/fruits/pear',
        time: time,
        headers: headers,
        host: host
      });

      expect(httpTransaction.rpmMetrics).to.be.eql({
        301: metricsValue + 1
      });

      done();
    });
  });
});
