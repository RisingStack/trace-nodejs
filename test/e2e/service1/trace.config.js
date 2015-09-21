var traceConfig = {};

traceConfig.appName = 'service1';
traceConfig.reporter = require('../../../lib/reporters').trace.create({
  apiKey: 'key',
  collectInterval: 100
});

module.exports = traceConfig;

