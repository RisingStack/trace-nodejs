var cls = require('continuation-local-storage')

// Just a very thin wrapper around 'continuation-local-storage'

function Storage () {
  this.ns = cls.createNamespace('@risingstack/trace')
}

Storage.prototype.get = function (name) {
  return this.ns.get(name)
}

Storage.prototype.set = function (name, data) {
  this.ns.set(name, data)
}

Storage.prototype.bind = function (fn, context) {
  return this.ns.bind(fn, context)
}

Storage.prototype.bindNew = function (fn) {
  return this.ns.bind(fn, this.ns.createContext())
}

Storage.prototype.bindEmitter = function (emitter) {
  return this.ns.bindEmitter(emitter)
}

module.exports = Storage

module.exports.create = function () {
  return new Storage()
}
