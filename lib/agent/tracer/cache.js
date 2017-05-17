'use strict'
var levels = require('./severity')

function Cache (options) {
  this.mustCollectSeverity = options && options.mustCollectSeverity
  this.root = createNode()
  this.ttl = (options && options.ttl) || 30 * 1000
}

function forEachPath (node, path, f) {
  var i = path.length - 1
  do {
    f(node)
    node = node.c && node.c[path[i--]]
  } while (node)
}

function seekTo (node, path) {
  var parent
  for (var i = path.length - 1; i >= 0; --i) {
    parent = node
    node = parent.c && parent.c[path[i]]
    if (!node) { return }
  }
  return node
}

function forEachTree (node, f) {
  var top
  var st = [node]
  while (st.length) {
    top = st.shift()
    if (top.d) { f(top) }
    if (top.c) {
      for (var c in top.c) {
        st.unshift(top.c[c])
      }
    }
  }
}

/*
  Increments lock count by 1 for every node in the given ancestry path.
*/
Cache.prototype.lock = function (path) {
  forEachPath(this.root, path, function (node) {
    ++node.l
  })
}

/*
  Decrements lock count by 1 for every node in the given ancestry path.
*/
Cache.prototype.unlock = function (path) {
  forEachPath(this.root, path, function (node) {
    if (node.l > 0) { --node.l }
  })
}

/*
  If the given path is not locked (lock count is 0), it removes the subtree from
  the graph. If severity is sufficient, returns the removed subtree as an array.
*/
Cache.prototype.flush = function (path) {
  var node = seekTo(this.root, path)
  var flushed = []
  if (!node || node.l > 0) {
    return flushed
  }
  if (levels.gte(node.s, this.mustCollectSeverity)) {
    forEachTree(node, function (n) { flushed.push(n.d) })
  }
  if (node.p) {
    delete node.p.c[path[0]]
  } else {
    this.root = createNode()
  }
  return flushed
}

/*
  Returns the given subtree or []
*/
Cache.prototype.get = function (path) {
  var node = seekTo(this.root, path)
  var result = []
  if (!node) {
    return result
  }
  forEachTree(node, function (n) { result.push(n.d) })
  return result
}

/*
  ~ Merges the given path, with the graph.
  If node exists keeps data
  If not inserts it.
  Updates timestamp either ways.
*/
Cache.prototype.merge = function (path, events, severity, ts) {
  ts = ts || Date.now()
  var node = this.root
  for (var i = path.length - 1; i >= 0; --i) {
    var id = path[i]
    if (!node.c || !node.c[id]) {
      if (!node.c) { node.c = { } }
      node.c[id] = createNode(severity, events[i], undefined, node, 0, ts)
    }
    if (node !== this.root) {
      node.s = levels.greater(node.s, severity)
      node.t = ts
    }
    node = node.c[id]
  }
}

/*
  Flushes expired subtrees of all immediate descendants of the node.
  If an immediate descendant has not expired, continues.
  If immediate descendant has expired and has sufficient severity, removes subtree,
  appends to return array and continues.
  Else does not append to return array and continues.
*/
Cache.prototype.flushExpiredChildren = function (path, until) {
  until = until || Date.now()
  var node = seekTo(this.root, path)
  var flushed = []
  var ch
  if (!node || !node.c) {
    return []
  }
  for (var c in node.c) {
    ch = node.c[c]
    if (until - ch.t >= this.ttl) {
      if (levels.gte(ch.s, this.mustCollectSeverity)) {
        forEachTree(ch, function (n) { flushed.push(n.d) })
      }
      delete node.c[c]
    }
  }
  return flushed
}

Cache.MAX_TIMESTAMP = 8640000000000000

module.exports = Cache
module.exports.create = function (options) {
  return new Cache(options)
}

function createNode (severity, data, children, parent, locks, timestamp) {
  return {
    s: severity, // severity
    d: data, // data
    c: children, // map of child id -> child node
    p: parent, // parent node
    l: locks, // lock count
    t: timestamp  // timestamp of creation
  }
}
