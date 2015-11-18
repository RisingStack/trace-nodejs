var config = {};

config.collectInterval = process.env.TRACE_COLLECT_INTERVAL || 2 * 60 * 1000;
config.sampleSize = 60;
config.initialSampleRate = process.env.TRACE_INITIAL_SAMPLE_RATE || 50;

config.collectorApi = process.env.TRACE_COLLECTOR_API_URL ||
  'https://trace-collector-api.risingstack.com';
config.collectorApiSampleEndpoint = '/service/sample';
config.collectorApiServiceEndpoint = '/service';
config.collectorApiApmMetricsEndpoint = '/service/%s/apm-metrics';
config.collectorApiRpmMetricsEndpoint = '/service/%s/rpm-metrics';

config.appName = process.env.TRACE_APP_NAME;
config.configPath = process.env.TRACE_CONFIG_PATH;
config.reporterConfig = process.env.TRACE_REPORTER_CONFIG;
config.reporterType = process.env.TRACE_REPORTER_TYPE;

config.whiteListHosts = [
  'localhost:4000',
  'trace-collector-api.risingstack.com'
];

module.exports = config;
