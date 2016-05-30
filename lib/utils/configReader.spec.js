var expect = require('chai').expect

var fs = require('fs')

var ConfigReader = require('./configReader')

describe('Config Reader module', function () {
  var testApiToken = 'headers.payload.signature'

  it('creates a configReader', function () {
    var config = { }

    var configReader = ConfigReader.create(config)

    expect(configReader).to.exist
  })

  it('default config should be checked', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      apiKey: testApiToken
    })

    var getDefaultConfigStub = this.sandbox.stub(configReader, '_getDefaultConfig', function () {
      return {
        test: 'default',
        collectorApiUrl: 'http://c.a.b'
      }
    })

    configReader.getConfig()

    expect(getDefaultConfigStub).to.have.been.calledOnce
  })

  it('file config should be checked', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      collectorApiUrl: 'http://c.a.b',
      apiKey: testApiToken
    })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { test: 'file' }
    })
    var config = configReader.getConfig()

    expect(getFileConfigStub).to.have.been.calledOnce
    expect(config.test).to.eql('file')
  })

  it('environment variables should be checked', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      collectorApiUrl: 'http://c.a.b',
      apiKey: testApiToken
    })

    var getEnvVarConfigStub = this.sandbox.stub(configReader, '_getEnvVarConfig', function () {
      return { test: 'env' }
    })

    var config = configReader.getConfig()

    expect(getEnvVarConfigStub).to.have.been.calledOnce
    expect(config.test).to.eql('env')
  })

  it('system configuration should be checked', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      collectorApiUrl: 'http://c.a.b',
      apiKey: testApiToken
    })

    var getSystemConfigStub = this.sandbox.stub(configReader, '_getSystemConfig', function () {
      return { test: 'system' }
    })

    var config = configReader.getConfig()

    expect(getSystemConfigStub).to.have.been.calledOnce
    expect(config.test).to.eql('system')
  })

  it('file config should override default config', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      collectorApiUrl: 'http://c.a.b',
      apiKey: testApiToken
    })

    this.sandbox.stub(configReader, '_getEnvVarConfig').returns({})

    this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { test: 'file' }
    })

    this.sandbox.stub(configReader, '_getDefaultConfig', function () {
      return { test: 'default' }
    })

    var config = configReader.getConfig()

    expect(config.test).to.eql('file')
  })

  it('environment variables config should override file config', function () {
    var configReader = ConfigReader.create({ serviceName: 'test', reporter: 'dummy', apiKey: testApiToken })

    this.sandbox.stub(configReader, '_getEnvVarConfig', function () {
      return { test: 'env' }
    })

    this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { test: 'file' }
    })

    var config = configReader.getConfig()

    expect(config.test).to.eql('env')
  })

  it('system config should override all env var config', function () {
    var configReader = ConfigReader.create({ serviceName: 'test', reporter: 'dummy', apiKey: testApiToken })

    this.sandbox.stub(configReader, '_getSystemConfig', function () {
      return { test: 'system' }
    })

    this.sandbox.stub(configReader, '_getEnvVarConfig', function () {
      return { test: 'env' }
    })

    this.sandbox.stub(configReader, '_getFileConfig').returns({})

    var config = configReader.getConfig()

    expect(config.test).to.eql('system')
  })

  it('parameter config should override system config', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      test: 'param',
      apiKey: testApiToken
    })

    this.sandbox.stub(configReader, '_getSystemConfig', function () {
      return { test: 'system' }
    })

    this.sandbox.stub(configReader, '_getFileConfig').returns({})

    var config = configReader.getConfig()

    expect(config.test).to.eql('param')
  })

  it('works with Cloud Foundry', function () {
    process.env.VCAP_APPLICATION = JSON.stringify({
      name: 'test-app'
    })

    process.env.VCAP_SERVICES = JSON.stringify({
      trace: [{
        credentials: {
          TRACE_API_KEY: testApiToken
        }
      }]
    })

    var configReader = ConfigReader.create({
      reporter: 'dummy',
      collectorApiUrl: 'http://c.a.b'
    })

    var cfg = configReader.getConfig()

    expect(cfg.serviceName).to.eql('test-app')
    expect(cfg.apiKey).to.eql(testApiToken)
    delete process.env.VCAP_APPLICATION
    delete process.env.VCAP_SERVICES
  })

  it('loads VM specific config (LXC/Docker)', function () {
    this.sandbox.stub(fs, 'readFileSync', function () {
      return '11:memory:/docker'
    })

    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      collectorApiUrl: 'http://c.a.b',
      apiKey: testApiToken
    })

    this.sandbox.stub(configReader, '_getDefaultConfig', function () {
      return { configPath: 'default' }
    })

    expect(configReader.getConfig().isRunningInVm).to.eql(true)
  })

  it('can find config file by default config', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      collectorApiUrl: 'http://c.a.b',
      apiKey: testApiToken
    })

    this.sandbox.stub(configReader, '_getDefaultConfig', function () {
      return { configPath: 'default' }
    })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig').returns({})

    configReader.getConfig()

    expect(getFileConfigStub).to.have.been.calledOnce
    expect(getFileConfigStub).to.have.been.calledWith('default')
  })

  it('can find config file by environment variable config', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      apiKey: testApiToken
    })

    this.sandbox.stub(configReader, '_getEnvVarConfig', function () {
      return { configPath: 'env' }
    })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig').returns({})

    configReader.getConfig()

    expect(getFileConfigStub).to.have.been.calledOnce
    expect(getFileConfigStub).to.have.been.calledWith('env')
  })

  it('can find config file by parameter config', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      configPath: 'param',
      apiKey: testApiToken
    })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig').returns({})

    configReader.getConfig()

    expect(getFileConfigStub).to.have.been.calledOnce
    expect(getFileConfigStub).to.have.been.calledWith('param')
  })

  it('silently ignores missing config file', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      configPath: 'a/surely/nonexisting/path',
      apiKey: testApiToken
    })

    configReader.getConfig()
  })

  it('throws readable error on loading invalid config file', function () {
    var configReader = ConfigReader.create({ serviceName: 'test', reporter: 'dummy', configPath: 'test' })

    try {
      configReader.getConfig()
    } catch (ex) {
      expect(ex).to.be.eql(new Error('Invalid trace.config.js configuration file'))
      return
    }

    throw new Error('Error should have been thrown')
  })

  it('does not throw error if TRACE_IGNORE_HEADERS is malformed, and uses the next highest priority source for the ignoreHeaders config', function () {
    process.env.TRACE_IGNORE_HEADERS = 'This is not a valid JSON'
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      configPath: 'test',
      apiKey: testApiToken
    })
    var log = this.sandbox.spy(console, 'error')
    var wellformed = {
      'user-agent': ['007']
    }

    this.sandbox.stub(configReader, '_readConfigFile', function () {
      return { ignoreHeaders: wellformed }
    })

    this.sandbox.stub(configReader, '_getDefaultConfig', function () {
      return {
        test: 'default',
        collectorApiUrl: 'http://c.a.b'
      }
    })

    this.sandbox.stub(fs, 'statSync', function () {
      return { }
    })

    try {
      var config = configReader.getConfig()
      expect(config.ignoreHeaders).to.eql(wellformed)
      expect(log).to.have.been.calledOnce
      delete process.env.TRACE_IGNORE_HEADERS
    } catch (err) {
      delete process.env.TRACE_IGNORE_HEADERS
      throw err
    }
  })

  it('throws readable error when apiKey is missing', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      configPath: 'test'
    })

    try {
      configReader.getConfig()
    } catch (ex) {
      expect(ex).to.be.eql(new Error('Missing apiKey'))
      return
    }

    throw new Error('Error should have been thrown')
  })

  it('throws readable error when serviceName is missing', function () {
    var configReader = ConfigReader.create({
      apiKey: 'test',
      reporter: 'dummy',
      configPath: 'test'
    })

    try {
      configReader.getConfig()
    } catch (ex) {
      expect(ex).to.be.eql(new Error('Missing serviceName'))
      return
    }

    throw new Error('Error should have been thrown')
  })

  it('whitelists default collectorApiUrl host', function () {
    var configReader = ConfigReader.create({
      apiKey: testApiToken,
      serviceName: 'test'
    })

    var config = configReader.getConfig()

    expect(config.whiteListHosts).to.be.eql([ 'trace-collector-api.risingstack.com' ])
  })

  it('whitelists collectorApiUrl host from config', function () {
    var configReader = ConfigReader.create({
      collectorApiUrl: 'http://c.a.b',
      apiKey: testApiToken,
      serviceName: 'test'
    })

    var config = configReader.getConfig()

    expect(config.whiteListHosts).to.be.eql([ 'c.a.b' ])
  })

  it('appends whitelist hosts from parameter config', function () {
    var configReader = ConfigReader.create({
      collectorApiUrl: 'http://c.a.b',
      whiteListHosts: [ 'fake.host1.com', 'fake.host2.com' ],
      apiKey: testApiToken,
      serviceName: 'test'
    })

    var config = configReader.getConfig()

    expect(config.whiteListHosts).to.be.eql([ 'c.a.b', 'fake.host1.com', 'fake.host2.com' ])
  })

  it('appends whitelist hosts from environment config', function () {
    process.env.TRACE_WHITELIST_HOSTS = JSON.stringify(
      [ 'fake.host1.com', 'fake.host2.com' ]
    )

    var configReader = ConfigReader.create({
      collectorApiUrl: 'http://c.a.b',
      apiKey: testApiToken,
      serviceName: 'test'
    })

    try {
      var config = configReader.getConfig()
      expect(config.whiteListHosts).to.be.eql([ 'c.a.b', 'fake.host1.com', 'fake.host2.com' ])

      delete process.env.TRACE_WHITELIST_HOSTS
    } catch (err) {
      delete process.env.TRACE_WHITELIST_HOSTS
      throw err
    }
  })

  it('does not throw error if TRACE_WHITELIST_HOSTS is malformed, and uses the next highest priority source for the ignoreHeaders config', function () {
    process.env.TRACE_WHITELIST_HOSTS = 'This is not a valid JSON'
    var configReader = ConfigReader.create({
      apiKey: testApiToken,
      serviceName: 'test',
      configPath: 'test'
    })
    var log = this.sandbox.spy(console, 'error')
    var expected = [ 'c.a.b', 'fake.host1.com', 'fake.host2.com' ]

    this.sandbox.stub(configReader, '_readConfigFile', function () {
      return { whiteListHosts: expected.slice(1) }
    })

    this.sandbox.stub(configReader, '_getDefaultConfig', function () {
      return {
        collectorApiUrl: 'http://c.a.b'
      }
    })

    this.sandbox.stub(fs, 'statSync', function () {
      return { }
    })

    try {
      var config = configReader.getConfig()
      expect(config.whiteListHosts).to.eql(expected)
      expect(log).to.have.been.calledOnce
      delete process.env.TRACE_WHITELIST_HOSTS
    } catch (err) {
      delete process.env.TRACE_WHITELIST_HOSTS
      throw err
    }
  })

  it('appends whitelist hosts from file config', function () {
    var configReader = ConfigReader.create({
      collectorApiUrl: 'http://c.a.b',
      apiKey: testApiToken,
      serviceName: 'test'
    })

    this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { whiteListHosts: [ 'fake.host1.com', 'fake.host2.com' ] }
    })
    var config = configReader.getConfig()

    expect(config.whiteListHosts).to.be.eql([ 'c.a.b', 'fake.host1.com', 'fake.host2.com' ])
  })
})
