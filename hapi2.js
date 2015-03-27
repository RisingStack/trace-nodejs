var seetru = require('./lib')({
  app: 'colgate'
});

var Hapi = require('hapi');
var superagent = require('superagent');

var server = new Hapi.Server();
server.connection({ port: 3003 });

server.route({
  method: 'GET',
  path:'/users/1',
  handler: function (request, reply) {

    reply({status: 'ok'})
  }
});

server.start(function () {
  console.log('Hapi Server running at:', server.info.uri);
});
