var url = require('url')
var config = {}

config.collectInterval = 2 * 60 * 1000
config.sampleSize = 60
config.initialSampleRate = 50

config.collectorLanguage = 'nodejs'
config.collectorApiUrl = 'https://trace-collector-api.risingstack.com'
config.collectorApiSampleEndpoint = '/v2/service/sample'
config.collectorApiServiceEndpoint = '/v2/service'
config.collectorApiApmMetricsEndpoint = '/service/%s/apm-metrics'
config.collectorApiRpmMetricsEndpoint = '/service/%s/rpm-metrics'
config.collectorApiEdgeMetricsEndpoint = '/service/%s/edge-metrics'
config.collectorApiIncomingEdgeMetricsEndpoint = '/service/%s/edge-metrics-incoming'

config.configPath = 'trace.config'

var collectorApiHost = url.parse(config.collectorApiUrl).host

config.whiteListHosts = [
  collectorApiHost
]

module.exports = config
