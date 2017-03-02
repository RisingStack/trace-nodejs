'use strict'
module.exports = function tryParseSql (raw) {
  if (typeof raw !== 'string') {
    return
  }
  var matches = /\s*(select|update|insert|delete)/i.exec(raw)
  return matches ? matches[1] : undefined
}
