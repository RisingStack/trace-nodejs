var url = require('url')
var config = {}

config.collectInterval = 2 * 60 * 1000
config.sampleSize = 60
config.initialSampleRate = 50

config.collectorApiUrl = 'https://trace-collector-api.risingstack.com'
config.collectorApiSampleEndpoint = '/service/sample'
config.collectorApiServiceEndpoint = '/service'
config.collectorApiApmMetricsEndpoint = '/service/%s/apm-metrics'
config.collectorApiRpmMetricsEndpoint = '/service/%s/rpm-metrics'
config.collectorApiEdgeMetricsEndpoint = '/service/%s/edge-metrics'

config.configPath = 'trace.config'

var collectorApiHost = url.parse(config.collectorApiUrl).host

config.whiteListHosts = [
  collectorApiHost
]

module.exports = config
