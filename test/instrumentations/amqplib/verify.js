#!/usr/bin/env node
'use strict'

if (require.main === module) {
  main(process.argv.slice(2))
}

function main (args) {
  require('amqplib')
    .connect(process.env.AMQP_URL)
    .then(function (conn) {
      return conn.createChannel()
    })
    .then(function (ch) {
      return ch.assertQueue('test')
    })
    .then(function () {
      process.exit(0)
    })
}
