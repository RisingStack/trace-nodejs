var sinon = require('sinon')
var chai = require('chai')
var sinonChai = require('sinon-chai')

before(function () {
  chai.use(sinonChai)
})

beforeEach(function () {
  this.sandbox = sinon.sandbox.create()
})

afterEach(function () {
  this.sandbox.restore()
})
