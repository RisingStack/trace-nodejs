'use strict'

var trace = require('@risingstack/trace')

var app = require('express')()
var bodyParser = require('body-parser')
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.send('hello word')
  console.log(trace.getTransactionId())
})

app.post('/', function (req, res) {
  if (req.body) {
    trace.report('data', req.body)
    console.log(trace.getTransactionId())
  }
  res.send(200)
})

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
