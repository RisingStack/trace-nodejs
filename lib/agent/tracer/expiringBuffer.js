
var shiftRight = typeof Array.prototype.copyWithin === 'function'
  ? function (arr) {
    arr.copyWithin(1, 0, arr.length - 1)
  } : function (arr) {
    arr.pop()
    arr.unshift(undefined)
    delete arr[0]
  }

function ExpiringBuffer (ttl) {
  this._ttl = ttl || 1
  if (this._ttl === 1) {
    this._buckets = []
  } else {
    this._buckets = new Array(this._ttl)
  }
}

ExpiringBuffer.prototype.clear = function () {
  this._buckets = new Array(this._ttl)
}

ExpiringBuffer.prototype.push = function (item) {
  if (this._ttl === 1) {
    this._buckets.push(item)
  } else {
    if (!this._buckets[0]) {
      this._buckets[0] = [item]
    } else {
      this._buckets[0].push(item)
    }
  }
}

ExpiringBuffer.prototype.elements = function () {
  if (this._ttl === 1) {
    return this._buckets
  } else {
    return this._buckets.reduce(function (acc, value) {
      return value.concat(acc)
    }, [])
  }
}

ExpiringBuffer.prototype.flush = function () {
  var elements = this.elements()
  this.clear()
  return elements
}

ExpiringBuffer.prototype.isEmpty = function () {
  if (this._ttl === 1) {
    return this._buckets.length === 0
  } else {
    return !this._buckets.some(function (b) {
      return b.length !== 0
    })
  }
}

ExpiringBuffer.prototype.expire = function () {
  var result
  if (this._ttl === 1) {
    result = this._buckets
    this._buckets = []
    return result
  } else {
    result = this._buckets[this._buckets.length - 1]
    shiftRight(this._buckets)
    delete this._buckets[0]
    return result
  }
}

module.exports = ExpiringBuffer
