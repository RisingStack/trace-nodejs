#!/usr/bin/env node

'use strict'

if (require.main === module) {
  main(process.argv.slice(2))
}

function main (args) {
  var mongodb = require('mongodb')
  var url = args[0]

  mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
      console.error('Unable to connect to \'' + url + '\':', err)
      db.close()
      process.exit(1)
    }
    db.close()
  })
}
