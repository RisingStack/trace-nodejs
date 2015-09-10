var traceConfig = {};

traceConfig.appName = 'service1';
traceConfig.reporter = require('../../../lib/reporters').trace.create({
  apiKey: 'key',
  appName: traceConfig.appName,
  collectInterval: 100
});

module.exports = traceConfig;

