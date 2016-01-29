'use strict'

/*
* Require trace as the first dependency of your project.
*/
var trace = require('@risingstack/trace')

var app = require('express')()
var bodyParser = require('body-parser')
var count = 0

/*
* You can report arbitrary information with trace. You have to be in the middle
* of an HTTP transaction to do this.
*/
function reportCount (count) {
  trace.report('count', {
    current: count
  })
}

app.use(bodyParser.json())

app.get('/', function (req, res) {
  ++count
  console.log(trace.getTransactionId() + ' is the ' + count + '. transaction in this node')
  reportCount(count)

  res.send('hello')
})

app.post('/', function (req, res) {
  ++count
  console.log(trace.getTransactionId() + ' is the ' + count + '. transaction in this node')
  reportCount(count)

  if (req.body && req.body.malicious) {
    console.log('reporting malicious content')
    trace.report('malicious', req.body.malicious)
  }
  res.sendStatus(200)
})

app.listen(3000, function (err) {
  if (err) {
    throw err
  }
  console.log('example app is listening')
})
