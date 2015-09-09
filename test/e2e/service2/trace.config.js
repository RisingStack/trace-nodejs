var traceConfig = {};

traceConfig.appName = 'service2';
traceConfig.reporter = require('../../../lib/reporters').trace.create({
  apiKey: 'key',
  appName: traceConfig.appName
});

module.exports = traceConfig;

