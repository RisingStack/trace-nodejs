var cls = require('continuation-local-storage')

before(function () {
  this.ns = cls.createNamespace('app')
  require('./').create({
    agent: {
      bind: function (fn) {
        return this.ns.bind(fn)
      }.bind(this)
    }
  })
})
