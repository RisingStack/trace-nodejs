var format = require('util').format

module.exports = function (lvl, func, message) {
  if (!func) {
    return format('[' + lvl + '] ' + message)
  }
  return format('[' + lvl + '] ' + func + ': ' + message)
}

module.exports.levels = {
  WARN: 'WARN ',
  INFO: 'INFO ',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
}
