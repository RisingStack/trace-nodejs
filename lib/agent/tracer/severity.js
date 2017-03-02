'use strict'
module.exports = {
  EMERG: 0,
  ALERT: 1,
  CRIT: 2,
  ERROR: 3,
  WARN: 4,
  NOTICE: 5,
  INFO: 6,
  DEBUG: 7,

  greater: function (a, b) {
    if (a != null && b != null) {
      return a < b ? a : b
    } else if (a != null) {
      return a
    } else {
      return b
    }
  },
  gte: function (a, b) {
    if (a != null && b != null) {
      return a <= b
    } else if (b != null) {
      return false
    }
    return true
  }
}
