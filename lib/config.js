var path = require('path');

var config = {};

config.collectInterval = 120 * 1000;
config.sampleSize = 60;

config.collectorApi = process.env.COLLECTOR_API_URL ||
  'https://trace-collector-api.risingstack.com';
config.collectorApiSampleEndpoint = '/service/sample';
config.collectorApiServiceEndpoint = '/service';

if (process.env.TRACE_LOGFILE_PATH) {
  config.logFilePath = path.resolve(process.env.TRACE_LOGFILE_PATH) + '/';
} else {
  config.logFilePath = path.join(__dirname, '../../../../');
}
config.logFilePrefix = 'trace_';

config.appName = process.env.TRACE_APP_NAME;
config.configPath = process.env.TRACE_CONFIG_PATH;
config.reporterConfig = process.env.TRACE_REPORTER_CONFIG;
config.reporterType = process.env.TRACE_REPORTER_TYPE;

config.whiteListHosts = [
  config.collectorApi
];

module.exports = config;
