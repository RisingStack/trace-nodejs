var path = require('path');

var config = {};

config.collectInterval = 10 * 1000;
config.sampleSize = 60;

config.collectorApi = 'http://comingsoon.trace.risingstack.com';
config.collectorApiServiceEndpoint = '/service';
config.collectorApiSampleEndpoint = '/service/sample';

config.logFilePath = path.join(__dirname, '../../../../');
config.logFilePrefix = 'trace_';

config.configPath = process.env.TRACE_CONFIG_PATH;
config.reporterType = process.env.TRACE_REPORTER_TYPE;
config.reporterConfig = process.env.TRACE_REPORTER_CONFIG;
config.appName = process.env.TRACE_APP_NAME;

module.exports = config;
