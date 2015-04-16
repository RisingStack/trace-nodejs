var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({port: 8000});

server.route({
  method: 'POST',
  path: '/spans',
  handler: function (request, reply) {
    console.log(request.payload);
    reply();
  }
});

server.start(function () {
  console.log('Server running at:', server.info.uri);
});
