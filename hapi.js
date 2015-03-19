var seetru = require('./seetru');

var Hapi = require('hapi');
var superagent = require('superagent');

var server = new Hapi.Server();
server.connection({ port: 3001 });

server.route({
  method: 'GET',
  path:'/',
  handler: function (request, reply) {
    superagent
      .get('http://localhost:3002')
      .end(function(err, response) {
        reply(response.body);
      });
  }
});

server.start(function () {
  console.log('Hapi Server running at:', server.info.uri);
});
