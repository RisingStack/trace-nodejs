#!/usr/bin/env node

'use strict'

var pg = require('pg')
var fs = require('fs')
var path = require('path')

if (require.main === module) {
  main(process.argv.slice(2))
}

function main (args) {
  var client = new pg.Client(process.env.DB_URL)

  client.connect(exitOnError(onConnect))

  function onConnect () {
    // setup test user for password test
    var sql = fs.readFileSync(path.resolve(__dirname, 'create_user.sql'), { encoding: 'utf8' })
    client.query(sql, exitOnError(onQuery))
  }

  function onQuery () {
    client.end(exitOnError())
  }
}

function exitOnError (f) {
  return function (err) {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    f && f.apply(this, arguments)
  }
}
