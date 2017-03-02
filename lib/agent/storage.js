'use strict'
var cls = require('continuation-local-storage')

// Just a very thin wrapper around 'continuation-local-storage'

function Storage (name) {
  this.ns = cls.createNamespace('@risingstack/trace:' + name)
}

Storage.prototype.get = function (name) {
  if (!name) { name = 'default' }
  return this.ns.get(name)
}

Storage.prototype.set = function (name, data) {
  if (!name) { name = 'default' }
  this.ns.set(name, data)
}

Storage.prototype.bind = function (fn, context) {
  return this.ns.bind(fn, context)
}

Storage.prototype.run = function (fn) {
  return this.ns.run(fn)
}

Storage.prototype.bindNew = function (fn) {
  return this.ns.bind(fn, this.ns.createContext())
}

Storage.prototype.bindEmitter = function (emitter) {
  return this.ns.bindEmitter(emitter)
}

module.exports = Storage

module.exports.create = function (name) {
  return new Storage(name)
}
