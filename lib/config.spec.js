var expect = require('chai').expect

describe('Config', function () {
  it('whitelists collector api url\'s host', function () {
    var config = require('./config')
    expect(config.whiteListHosts).to.be.eql([
      'trace-collector-api.risingstack.com'
    ])
  })
})
