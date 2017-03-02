'use strict'
var stream = require('stream')
var util = require('util')

function BufferStream (source) {
  stream.Readable.call(this)
  this._source = source
  this._offset = 0
  this._length = source.length
  this.on('end', this._destroy)
}

util.inherits(BufferStream, stream.Readable)

BufferStream.prototype._destroy = function () {
  this._source = null
}

BufferStream.prototype._read = function (size) {
  if (this._offset < this._length) {
    this.push(this._source.slice(this._offset, (this._offset + size)))
    this._offset += size
  }
  if (this._offset >= this._length) {
    this.push(null)
  }
}

module.exports = BufferStream
