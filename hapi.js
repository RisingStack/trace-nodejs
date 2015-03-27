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

    // console.log('Hapi Request hit at', process.hrtime());

    superagent
      .get('http://localhost:3002/cars/2')
      .end(function(err, response) {
        reply(response.body);
      });
  }
});

server.start(function () {
  console.log('Hapi Server running at:', server.info.uri);
});
