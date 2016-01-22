var url = require('url')
var config = {}

config.collectInterval = 2 * 60 * 1000
config.sampleSize = 60
config.initialSampleRate = 50

config.collectorApi = 'https://trace-collector-api.risingstack.com'
config.collectorApiSampleEndpoint = '/service/sample'
config.collectorApiServiceEndpoint = '/service'
config.collectorApiApmMetricsEndpoint = '/service/%s/apm-metrics'
config.collectorApiRpmMetricsEndpoint = '/service/%s/rpm-metrics'

config.configPath = 'trace.config'

var collectorApiHost = url.parse(config.collectorApi).host

config.whiteListHosts = [
  collectorApiHost
]

module.exports = config
