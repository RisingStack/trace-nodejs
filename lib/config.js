var config = {};

config.collectInterval = 10 * 1000;
config.sampleSize = 60;

config.collectorApi = 'http://seetru-collector-staging.herokuapp.com:80/service';

config.logFilePrefix = 'seetru_trace_';

module.exports = config;
