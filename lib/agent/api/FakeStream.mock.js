'use strict'
var util = require('util')
var Readable = require('stream').Readable
var Writable = require('stream').Writable

var FakeReadable = function (err) {
  Readable.call(this)
  this.err = err
}

util.inherits(FakeReadable, Readable)

FakeReadable.prototype._read = function () {
  this.push('1')
  if (this.err) this.push(this.err)
  this.push(null)
}

var FakeWritable = function () {
  Writable.call(this)
}

util.inherits(FakeWritable, Writable)

FakeWritable.prototype._write = function () {}
FakeWritable.prototype.write = function () {}
FakeWritable.prototype.end = function () {}

module.exports = {
  FakeReadable: FakeReadable,
  FakeWritable: FakeWritable
}
