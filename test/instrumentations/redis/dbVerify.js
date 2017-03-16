#!/usr/bin/env node

'use strict'

var redis = require('redis')

if (require.main === module) {
  main(process.argv.slice(2))
}

function main () {
  var client = redis.createClient(process.env.DB_URL)

  client.on('ready', function () {
    client.quit()
  })
  client.on('error', function (err) {
    throw err
  })
}
