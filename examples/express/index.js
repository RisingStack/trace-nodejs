'use strict'

var trace = require('@risingstack/trace')

var app = require('express')()
var bodyParser = require('body-parser')
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.send('hello word')
})

app.post('/', function (req, res) {
  if (req.body) {
    trace.report('data', req.body)
  }
  res.send(200)
})

console.log(trace.getTransactionId())

function reportTime () {
  trace.report('time', {
    now: new Date()
  })
  setTimeout(reportTime, 1000)
}

app.listen(3000, function (err) {
  if (err) {
    throw err
  }
  console.log('app is listening')
  reportTime()
})
