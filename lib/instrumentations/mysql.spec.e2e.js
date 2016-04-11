'use strict'

var wrap = require('./mysql')
var expect = require('chai').expect

function fakeAgent (sandbox) {
  return {
    generateSpanId: function () { return 'fakeSpanId' },
    getMicrotime: function () { return 42 },
    getTransactionId: function () { return 'fakeTransactionId' },
    clientSend: sandbox.spy(),
    clientReceive: sandbox.spy(),
    CLIENT_SEND: 'fakeSend'
  }
}

describe('The mysql wrapper', function () {
  var agent
  var connection
  it('should connect & instrument query & catch error', function (done) {
    agent = fakeAgent(this.sandbox)
    var mysql = wrap(require('mysql'), agent)
    connection = mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost', //
      user: process.env.MYSQL_USER || 'root', // these should be
      password: process.env.MYSQL_PASSWORD || '', // default install settings
      database: process.env.MYSQL_DATABASE || 'information_schema'
    })
    connection.connect(function (err) {
      if (err) {
        return console.error('could not connect to mysql: install mysql or check "mysql -uroot" in console', err)
      }
      var queryStr = 'SELECT 1 + 1 AS solution'
      connection.query(queryStr, function (err, rows, fields) {
        if (err) throw err
        expect(rows[0].solution).to.eql(2)
        expect(agent.clientReceive).to.have.been.calledWith({
          host: 'localhost',
          id: 'fakeTransactionId',
          method: 'SELECT',
          mustCollect: undefined,
          protocol: 'mysql',
          responseTime: 0,
          spanId: 'fakeSpanId',
          status: 0,
          statusCode: 200,
          time: 42,
          url: 'mysql://root@localhost:3306/information_schema'
        })
        done()
      })
      expect(agent.clientSend).to.have.been.called
      expect(agent.clientSend).to.have.been.calledWith({
        host: 'localhost',
        id: 'fakeTransactionId',
        method: 'SELECT',
        spanId: 'fakeSpanId',
        time: 42,
        type: 'fakeSend',
        url: 'mysql://' + connection.config.user + '@' +
          connection.config.host + ':' +
          connection.config.port + '/' +
          connection.config.database
      })
    })
  })
  it('should instrument error', function (done) {
    agent.clientSend.reset()
    agent.clientReceive.reset()
    var queryStr = 'SELECT 1 + AS solution'
    connection.query(queryStr, function (err, rows, fields) {
      expect(err !== false)
      expect(agent.clientSend).to.have.been.called
      expect(agent.clientReceive).to.have.been.calledWith({
        host: 'localhost',
        id: 'fakeTransactionId',
        method: 'SELECT',
        mustCollect: '1',
        protocol: 'mysql',
        responseTime: 0,
        spanId: 'fakeSpanId',
        status: 1,
        statusCode: 400,
        time: 42,
        url: 'mysql://root@localhost:3306/information_schema'
      })
      done()
    })
  })
})
