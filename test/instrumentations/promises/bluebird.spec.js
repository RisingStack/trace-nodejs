'use strict'
require('../test-setup.spec.js')

var test = require('./testPromise')

;['bluebird/js/release/promise', 'bluebird/js/main/promise'].forEach(function (name) {
  var bb
  try { bb = require(name) } catch (err) { }
  if (bb) test(name, bb())
})

test('bluebird', require('bluebird'))
