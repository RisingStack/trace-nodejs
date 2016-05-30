var config = {}

config.collectInterval = 2 * 60 * 1000
config.healthcheckInterval = 10 * 1000

config.collectorLanguage = 'nodejs'
config.collectorApiUrl = 'https://trace-collector-api.risingstack.com'
config.collectorApiSampleEndpoint = '/v2/service/sample'
config.collectorApiServiceEndpoint = '/v2/service'
config.collectorApiApmMetricsEndpoint = '/service/%s/apm-metrics'
config.collectorApiRpmMetricsEndpoint = '/service/%s/rpm-metrics'
config.collectorApiEdgeMetricsEndpoint = '/service/%s/edge-metrics'
config.collectorApiIncomingEdgeMetricsEndpoint = '/service/%s/edge-incoming'
config.collectorApiExternalEdgeMetricsEndpoint = '/service/%s/edge-external'
config.collectorApiHealthcheckEndpoint = '/service/%s/healthcheck'

config.configPath = 'trace.config'

config.whiteListHosts = [ ]

module.exports = config
