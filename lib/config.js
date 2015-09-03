var path = require('path');

var config = {};

config.collectInterval = 120 * 1000;
config.sampleSize = 60;

config.collectorApi = 'https://trace-collector-api.risingstack.com';
config.collectorApiSampleEndpoint = '/service/sample';
config.collectorApiServiceEndpoint = '/service';

config.logFilePath = path.join(__dirname, '../../../../');
config.logFilePrefix = 'trace_';

config.appName = process.env.TRACE_APP_NAME;
config.configPath = process.env.TRACE_CONFIG_PATH;
config.reporterConfig = process.env.TRACE_REPORTER_CONFIG;
config.reporterType = process.env.TRACE_REPORTER_TYPE;

config.whiteListHosts = [
  'https://trace-collector-api.risingstack.com:443'
];

module.exports = config;
