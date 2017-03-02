'use strict'
// eslint-disable-next-line no-useless-escape
var DATA_URI_REGEX = /(data:([a-z]+\/[a-z0-9\-\+]+(;[a-z\-]+\=[a-z0-9\-]+)?)?(;base64)?,)([a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*)$/i

function formatDataUrl (text) {
  if (!text) {
    return
  }

  return text.replace(DATA_URI_REGEX, function replacer (match, p1) {
    return [p1, '{data}'].join('')
  })
}

module.exports.formatDataUrl = formatDataUrl
