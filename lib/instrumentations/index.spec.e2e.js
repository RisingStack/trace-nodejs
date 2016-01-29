var cls = require('continuation-local-storage')

before(function () {
  this.ns = cls.createNamespace('app')
  require('./').instrument(this.ns)
})
