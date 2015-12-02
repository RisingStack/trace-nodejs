var Logstash = require('logstash-client')

function LogstashReporter (options) {
  this.type = options.type || process.env.LOGSTASH_TYPE || 'tcp'
  this.host = options.host || process.env.LOGSTASH_HOST
  this.port = options.port || process.env.LOGSTASH_PORT

  // check if everything is ok with config
  if (!this.host) {
    throw new Error('Missing host')
  }

  if (!this.port) {
    throw new Error('Missing port')
  }

  this.logstashClient = new Logstash({
    type: this.type,
    host: this.host,
    port: this.port,
    format: function (data) {
      data['@timestamp'] = new Date()
      return JSON.stringify(data) + '\n'
    }
  })
}

LogstashReporter.prototype.send = function (data, callback) {
  this.logstashClient.send(data, callback)
}

function create (options) {
  return new LogstashReporter(options)
}

module.exports.create = create
