var expect = require('chai').expect

var Healthcheck = require('./')

describe('The Healthcheck module', function () {
  it('pings the collector', function () {
    var collectorApi = {
      ping: this.sandbox.spy()
    }

    var healthcheck = Healthcheck.create({
      collectorApi: collectorApi,
      config: {
        healthcheckInterval: 1
      }
    })

    healthcheck.ping()

    expect(collectorApi.ping).to.be.called
  })
})
