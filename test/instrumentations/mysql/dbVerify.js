#!/usr/bin/env node

'use strict'

var mysql = require('mysql')

if (require.main === module) {
  main(process.argv.slice(2))
}

function main (args) {
  var connection = mysql.createConnection({
    multipleStatements: true,
    host: process.env.MYSQL_HOST || 'localhost',
    user: 'root',
    password: ''
  })

  connection.connect(exitOnError(createUser))

  function createUser () {
    // setup test user for password test
    console.log('creating test user')
    connection.query("GRANT ALL PRIVILEGES ON *.* TO 'password_test'@'localhost' IDENTIFIED BY 'password';", exitOnError(onQuery))
  }

  function onQuery () {
    connection.end(exitOnError())
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
