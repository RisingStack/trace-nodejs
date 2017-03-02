'use strict'
function ReservoirSampler (limit) {
  this.MAX_ITEMS = limit || Infinity

  this._itemsSeen = 0
  this._data = []
}

ReservoirSampler.prototype.add = function (item) {
  var inserted = true
  if (this._itemsSeen < this.MAX_ITEMS) {
    this._data.push(item)
    inserted = true
  } else {
    inserted = this._replace(item)
  }
  this._itemsSeen++
  return inserted
}

ReservoirSampler.prototype.flush = function () {
  var data = this._data
  this._data = []
  this._itemsSeen = 0
  return data
}

ReservoirSampler.prototype.size = function () {
  return this._data.length
}

ReservoirSampler.prototype._replace = function (item) {
  var toReplaceIndex = Math.floor(Math.random() * (this._itemsSeen + 2))
  if (toReplaceIndex < this.MAX_ITEMS) {
    this._data[toReplaceIndex] = item
    return true
  }
  return false
}

module.exports = ReservoirSampler
module.exports.create = function (limit) {
  return new ReservoirSampler(limit)
}
