var spawn = require('child_process').spawn;

var servers = [
  'express.js',
  'hapi.js',
  'hapi2.js',
  'hapi3.js',
  'restify.js'
];

servers.forEach(function (server) {
  var spawned = spawn('node', ['example/' + server]);

  spawned.stdout.on('data', function (data) {
    console.log(server + data);
  });

  spawned.stderr.on('data', function (data) {
    console.log(server + data);
  });

  spawned.on('close', function (code) {
    console.log('child process exited with code ' + server + ' - ' + code);
  });
});