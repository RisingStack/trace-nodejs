
function Reservoir (limit) {
  this.MAX_ITEMS = limit || 10

  this._itemsSeen = 0
  this._data = []
}

Reservoir.prototype.add = function (item) {
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

Reservoir.prototype.flush = function () {
  var data = this._data
  this._data = []
  this._itemsSeen = 0
  return data
}

Reservoir.prototype._replace = function (item) {
  var toReplaceIndex = Math.floor(Math.random() * (this._itemsSeen + 2))
  if (toReplaceIndex < this.MAX_ITEMS) {
    this._data[toReplaceIndex] = item
    return true
  }
  return false
}

module.exports = Reservoir
