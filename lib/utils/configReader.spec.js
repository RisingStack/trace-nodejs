var expect = require('chai').expect

var ConfigReader = require('./configReader')

describe('Config Reader module', function () {
  it('creates a configReader', function () {
    var config = { }

    var configReader = ConfigReader.create(config)

    expect(configReader).to.exist
  })

  it('default config should be checked', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      apiKey: 'api-key'
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
      apiKey: 'api-key'
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
      apiKey: 'api-key'
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
      apiKey: 'api-key'
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
      apiKey: 'api-key'
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
    var configReader = ConfigReader.create({ serviceName: 'test', reporter: 'dummy', apiKey: 'api-key' })

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
    var configReader = ConfigReader.create({ serviceName: 'test', reporter: 'dummy', apiKey: 'api-key' })

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
      apiKey: 'api-key'
    })

    this.sandbox.stub(configReader, '_getSystemConfig', function () {
      return { test: 'system' }
    })

    this.sandbox.stub(configReader, '_getFileConfig').returns({})

    var config = configReader.getConfig()

    expect(config.test).to.eql('param')
  })

  it('can find config file by default config', function () {
    var configReader = ConfigReader.create({
      serviceName: 'test',
      reporter: 'dummy',
      collectorApiUrl: 'http://c.a.b',
      apiKey: 'api-key'
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
      apiKey: 'api-key'
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
      apiKey: 'api-key'
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
      apiKey: 'api-key'
    })

    configReader.getConfig()
  })

  it('throws readable error on loading invalid config file', function () {
    var configReader = ConfigReader.create({ serviceName: 'test', reporter: 'dummy', configPath: 'test' })
    var readConfigFileStub = this.sandbox.stub(configReader, '_readConfigFile', function () {
      // simulates an error
      throw new Error()
    })

    try {
      configReader.getConfig()
    } catch (ex) {
      expect(ex).to.be.eql(new Error('Invalid trace.config.js configuration file'))
      expect(readConfigFileStub).to.have.been.calledOnce
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
      apiKey: 'api-key'
    })
    var log = this.sandbox.spy(console, 'error')
    var wellformed = {
      'user-agent': ['007']
    }

    this.sandbox.stub(configReader, '_readConfigFile', function () {
      return { ignoreHeaders: wellformed }
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
})
