var expect = require('chai').expect
var Providers = require('./')

describe('The Providers module', function () {
  it('exposes httpTransaction', function () {
    expect(Providers.httpTransaction).to.be.ok
  })

  it('exposes apmMetrics', function () {
    expect(Providers.apmMetrics).to.be.ok
  })
})
