require('./lib')({
  app: 'restify'
});

var restify = require('restify');

function respond(req, res) {
  console.log('Restify Request hit at', process.hrtime());

  res.json({
    status: 'ok'
  });
}

var server = restify.createServer();
server.get('/cars/2', respond);

server.listen(3002, function() {
  console.log('Restify server %s listening at %s', server.name, server.url);
});
