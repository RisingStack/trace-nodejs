var config = {};

config.templateUrl = 'http://localhost:%d/';
config.services = [
  'service1',
  'service2'
];

config.portBase = process.env.PORT ? parseInt(process.env.PORT) : 3000;

module.exports = config;

