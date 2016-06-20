var expect = require('chai').expect
var instrumentor = require('./index')
var Shimmer = require('../utils/shimmer')

describe('The instrumentor module', function () {
  it('can be created', function () {
    var shimmerStub = this.sandbox.stub(Shimmer, 'wrap')

    instrumentor.create({
      config: {
        disableInstrumentations: ['mongodb', 'http']
      }
    })

    expect(instrumentor.CORE_LIBS.indexOf('http')).to.eql(-1)
    expect(instrumentor.INSTRUMENTED_LIBS.indexOf('mongodb')).to.eql(-1)
  })
})
