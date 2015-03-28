var seetru = require('./lib')({
  app: 'hapi'
});

var Hapi = require('hapi');
var superagent = require('superagent');

var server = new Hapi.Server();
server.connection({ port: 3001 });

server.route({
  method: 'GET',
  path:'/users/1',
  handler: function (request, reply) {

    superagent
      .get('http://localhost:3002/cars/2')
      .end(function(err, response) {

        var latency = Math.floor(Math.random() * 80) + 20;

        setTimeout(function () {
          reply(response.body);
        }, latency);


      });
  }
});

server.start(function () {
  console.log('Hapi Server running at:', server.info.uri);
});
