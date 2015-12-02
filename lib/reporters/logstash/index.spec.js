var LogstashReporter = require('./')

var expect = require('chai').expect
var sinon = require('sinon')

describe('The Logstash reporter module', function () {
  it('exists', function () {
    expect(LogstashReporter).to.be.ok
  })

  it('throws an error if host is missing', function () {
    try {
      LogstashReporter.create({
        port: 12201
      })
    } catch (ex) {
      expect(ex.message).to.eql('Missing host')
      return
    }

    throw new Error('Unhandled error')
  })

  it('throws an error if port is missing', function () {
    try {
      LogstashReporter.create({
        host: 'localhost'
      })
    } catch (ex) {
      expect(ex.message).to.eql('Missing port')
      return
    }

    throw new Error('Unhandled error')
  })

  it('can be instantiated w/ host and port', function () {
    var logstashReporter = LogstashReporter.create({
      host: 'localhost',
      port: 12201
    })

    expect(logstashReporter).to.be.ok
  })

  it('can send data to Logstash', function () {
    var options = {
      host: 'localhost',
      port: 15323
    }

    var logstashReporter = LogstashReporter.create(options)

    var data = {
      sampleRate: 1,
      samples: ['a', 'b', 'c']
    }

    sinon.stub(logstashReporter.logstashClient.transport, 'send', function (raw, cb) {
      expect(typeof raw).to.be.eq('string')
      var json = JSON.parse(raw)
      expect(json.samples.length).to.be.eq(3)
      expect(json['@timestamp']).to.be.ok
      cb(null)
    })

    logstashReporter.send(data, function (err) {
      expect(err).to.be.null
    })
  })
})
