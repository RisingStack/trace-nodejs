'use strict'
var config = {}

config.collectInterval = 2 * 60 * 1000
config.updateInterval = 15 * 1000
config.healthcheckInterval = 10 * 1000

config.samplerLimit = 100

config.collectorLanguage = 'nodejs'
config.collectorApiUrl = 'https://trace-collector-api.risingstack.com'
config.collectorApiSampleEndpoint = '/transaction-events'
config.collectorApiServiceEndpoint = '/v2/service'
config.collectorApiApmMetricsEndpoint = '/service/%s/apm-metrics'
config.collectorApiRpmMetricsEndpoint = '/service/%s/rpm-metrics'
config.collectorApiEdgeMetricsEndpoint = '/service/%s/edge-metrics'
config.collectorApiIncomingEdgeMetricsEndpoint = '/service/%s/edge-incoming'
config.collectorApiExternalEdgeMetricsEndpoint = '/service/%s/edge-external'
config.collectorApiHealthcheckEndpoint = '/service/%s/healthcheck'
config.collectorApiProfilerMemoryHeapdumpEndpoint = '/service/%s/memory-heapdump'
config.collectorApiProfilerCpuProfileEndpoint = '/service/%s/cpu-profile'
config.collectorApiControlEndpoint = '/service/%s/control'
config.collectorApiCustomMetrics = '/v2/service/%s/custom-metrics'
config.collectorApiSecurityDependenciesEndpoint = '/service/%s/dependencies'

config.configPath = 'trace.config'

config.whiteListHosts = []

module.exports = config
