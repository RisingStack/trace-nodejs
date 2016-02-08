'use strict'

var trace = require('@risingstack/trace')

var app = require('express')()
var bodyParser = require('body-parser')

var port = process.env.PORT || 7000

var count = 0

function reportTransaction (count) {
  trace.report('count', count)
}

app.use(bodyParser.json())

app.get('/', function (req, res) {
  count = count + 1
  reportTransaction(count)
  res.send('Hello')
})

app.post('/', function (req, res) {
  count = count + 1
  reportTransaction(count)
  if (req.body.malicious) {
    trace.report('malicious', {
      content: req.body.malicious
    })
    res.sendStatus(400)
  } else {
    trace.report('hello', 'hello')
    res.send('Hello')
  }
})

app.listen(port, function (err) {
  if (err) {
    throw err
  }

  console.log('app is listening on :' + port)
})
