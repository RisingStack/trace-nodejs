var expect = require('chai').expect
var defaults = require('lodash/object/defaults')

var ConfigReader = require('./configReader')

describe('Config Reader module', function () {
  it('creates a configReader', function () {
    var config = { }

    var configReader = ConfigReader.create(config)

    expect(configReader).to.exist
  })

  it('requires appName', function () {
    var config = { }

    var configReader = ConfigReader.create(config)

    expect(configReader.getConfig.bind(configReader)).to.throw('Missing appName');
  })

  it('does not override reporter if it is given', function () {
    var config = { appName: 'test', reporter: 'dummy' }

    var configReader = ConfigReader.create(config)

    var config = configReader.getConfig()

    expect(config.reporter).to.eql('dummy')
  })

  it('default config should be checked', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy' })

    var getDefaultConfigStub = this.sandbox.stub(configReader, '_getDefaultConfig', function () {
      return { test: 'default' }
    })

    var config = configReader.getConfig()

    expect(getDefaultConfigStub).to.have.been.calledOnce

  })


  it('file config should be checked', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy' })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { test: 'file' }
    })
    var config = configReader.getConfig()

    expect(getFileConfigStub).to.have.been.calledOnce
    expect(config.test).to.eql('file')

  })

  it('environment variables should be checked', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy' })

    var getEnvVarConfigStub = this.sandbox.stub(configReader, '_getEnvVarConfig', function () {
      return { test: 'env' }
    })

    var config = configReader.getConfig()

    expect(getEnvVarConfigStub).to.have.been.calledOnce
    expect(config.test).to.eql('env')

  })

  it('file config should override default config', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy' })

    var getEnvVarConfigStub = this.sandbox.stub(configReader, '_getEnvVarConfig', function () {
      return { }
    })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { test: 'file' }
    })

    var getDefaultConfigStub = this.sandbox.stub(configReader, '_getDefaultConfig', function () {
      return { test: 'default' }
    })

    var config = configReader.getConfig()

    expect(config.test).to.eql('file')

  })

  it('environment variables config should override file config', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy' })

    var getEnvVarConfigStub = this.sandbox.stub(configReader, '_getEnvVarConfig', function () {
      return { test: 'env' }
    })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { test: 'file' }
    })

    var config = configReader.getConfig()

    expect(config.test).to.eql('env')

  })

  it('parameter config should override environment variable config', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy', test: 'param' })

    var getEnvVarConfigStub = this.sandbox.stub(configReader, '_getEnvVarConfig', function () {
      return { test: 'env' }
    })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { }
    })

    var config = configReader.getConfig()

    expect(config.test).to.eql('param')

  })


  it('can find config file by default config', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy' })

    var getDefaultConfigStub = this.sandbox.stub(configReader, '_getDefaultConfig', function () {
      return { configPath: 'default' }
    })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { }
    })

    configReader.getConfig()

    expect(getFileConfigStub).to.have.been.calledOnce
    expect(getFileConfigStub).to.have.been.calledWith('default')
  })

  it('can find config file by environment variable config', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy' })

    var getEnvVarConfigStub = this.sandbox.stub(configReader, '_getEnvVarConfig', function () {
      return { configPath: 'env' }
    })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { }
    })

    configReader.getConfig()

    expect(getFileConfigStub).to.have.been.calledOnce
    expect(getFileConfigStub).to.have.been.calledWith('env')
  })

  it('can find config file by parameter config', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy', configPath: 'param' })

    var getFileConfigStub = this.sandbox.stub(configReader, '_getFileConfig', function () {
      return { }
    })

    configReader.getConfig()

    expect(getFileConfigStub).to.have.been.calledOnce
    expect(getFileConfigStub).to.have.been.calledWith('param')
  })

  it('silently ignores missing config file', function () {

    var configReader = ConfigReader.create({
      appName: 'test',
      reporter: 'dummy',
      configPath: 'a/surely/nonexisting/path' })


    var config = configReader.getConfig()

  })


  it('throws readable error on loading invalid config file', function () {

    var configReader = ConfigReader.create({ appName: 'test', reporter: 'dummy', configPath: 'test' })
    var requireStub = this.sandbox.stub(configReader, '_readConfigFile', function () {
      // simulates an error
      throw new Error()
    })

    try {
      configReader.getConfig("test")
    } catch (ex) {
      expect(ex).to.be.eql(new Error('Invalid trace.config.js configuration file'))
      expect(requireStub).to.have.been.calledOnce
      return
    }

    throw new Error('Error should have been thrown')
  })


})
