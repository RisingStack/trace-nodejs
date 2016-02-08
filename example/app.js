// index.js
var trace = require('@risingstack/trace')

var app = require('express')()

app.get('/', function (req, res) {
  trace.report('user-agent', {
    userAgent: req.headers['user-agent']
  })
  res.send('hello')
})

app.listen(3000)
