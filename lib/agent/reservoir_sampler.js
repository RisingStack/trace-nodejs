function Reservoir (limit) {
  this.MAX_ITEMS = limit || 10

  this.itemsSeen = 0
  this.data = []
}

Reservoir.prototype.addReturnsSuccess = function (item) {
  var inserted = true
  if (this.itemsSeen < this.MAX_ITEMS) {
    this.data.push(item)
    inserted = true
  } else {
    inserted = this._replaceSampledItemReturnsSuccess(item)
  }
  this.itemsSeen++
  return inserted
}

Reservoir.prototype.getItems = function () {
  return this.data
}

Reservoir.prototype._replaceSampledItemReturnsSuccess = function (item) {
  var toReplaceIndex = Math.floor(Math.random() * (this.itemsSeen + 2))
  if (toReplaceIndex < this.MAX_ITEMS) {
    this.data[toReplaceIndex] = item
    return true
  }
  return false
}

module.exports = Reservoir
