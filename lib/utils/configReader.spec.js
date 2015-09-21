var expect = require('chai').expect;
var defaults = require('lodash/object/defaults');

var ConfigReader = require('./configReader');

describe('Config Reader module', function () {
  it('creates a ConfigReader.create', function () {
    var collectorConfig = {
      foo: 'bar',
      reporterType: 'trace'
    };

    var configReader = ConfigReader.create(collectorConfig);

    expect(configReader.collectorConfig).to.be.eql(collectorConfig);
  });

  it('throw readable error upon _require throwing', function () {
    var collectorConfig = {
      foo: 'bar',
      reporterType: 'trace',
      configPath: './config'
    };
    var configReader = ConfigReader.create(collectorConfig);
    var requireStub = this.sandbox.stub(configReader, '_require', function () {
      throw new Error();
    });
    var config;

    try {
      config = configReader._initConfig();
    } catch (ex) {
      expect(ex).to.be.eql(new Error('Invalid trace.config.js configuration file'));
      expect(requireStub).to.have.been.calledOnce;
      expect(requireStub).to.have.been.calledWith(collectorConfig.configPath);
      return;
    }

    throw new Error('Error should have been thrown');
  });

  it('initialize config file', function () {
    var returnedConfig = {
      foo: 'bar'
    };

    var collectorConfig = {
      foo: 'bar',
      reporterType: 'trace',
      configPath: './config'
    };
    var configReader = ConfigReader.create(collectorConfig);
    var requireStub = this.sandbox.stub(configReader, '_require', function () {
      return returnedConfig;
    });

    var config = configReader._initConfig();

    expect(requireStub).to.have.been.calledOnce;
    expect(requireStub).to.have.been.calledWith(collectorConfig.configPath);
    expect(config).to.be.eql(returnedConfig);
  });

  it('throws readable error when no reporterConfig provided', function () {
    var collectorConfig = {
      reporterType: 'trace'
    };

    var configReader = ConfigReader.create(collectorConfig);

    try {
      configReader._getReporterConfig();
    } catch (ex) {
      expect(ex).to.be.eql(new Error('No reporter config'));
      return;
    }
    throw new Error('Error should have been thrown');
  });

  it('throws readable error when no invalid reporterType provided', function () {
    var collectorConfig = {
      reporterType: 'apple'
    };

    var configReader = ConfigReader.create(collectorConfig);

    try {
      configReader._getReporterConfig();
    } catch (ex) {
      expect(ex).to.be.eql(new Error('No reporter config'));
      return;
    }
    throw new Error('Error should have been thrown');
  });

  it('throws readable error upon JSON.parse throwing', function () {
    var collectorConfig = {
      reporterType: 'trace',
      reporterConfig: 'foo'
    };

    this.sandbox.stub(JSON, 'parse', function () {
      throw new Error();
    });

    var configReader = ConfigReader.create(collectorConfig);

    try {
      configReader._getReporterConfig();
    } catch (ex) {
      expect(ex).to.be.eql(new Error('Invalid reporter config JSON'));
      return;
    }

    throw new Error('Error should have been thrown');
  });

  it('gets the reporter config', function () {
    var collectorConfig = {
      reporterType: 'trace',
      reporterConfig: 'foo',
      appName: 'app'
    };
    var reporterConfig = {
      foo: 'bar'
    };

    var parseStub = this.sandbox.stub(JSON, 'parse', function () {
      return reporterConfig;
    });

    var configReader = ConfigReader.create(collectorConfig);
    var result = configReader._getReporterConfig();

    expect(result).to.be.eql(reporterConfig);
    expect(parseStub).to.have.been.calledOnce;
    expect(parseStub).to.have.been.calledWith(collectorConfig.reporterConfig);
  });

  it('gets the config', function () {
    var collectorConfig = {
      reporterType: 'trace',
      reporterConfig: 'foo',
      appName: 'app'
    };

    var config = {};

    var reporterConfig = {
      foo: 'bar'
    };

    var configReader = ConfigReader.create(collectorConfig);
    var getReporterConfigStub = this.sandbox.stub(configReader, '_getReporterConfig', function () {
      return reporterConfig;
    });

    var initStub = this.sandbox.stub(configReader, '_initConfig', function () {
      return config;
    });

    var reporters = {
      trace: {
        create: this.sandbox.spy(function () {
          return reporter;
        })
      }
    };

    var requireStub = this.sandbox.stub(configReader, '_require', function () {
      return reporters;
    });

    var reporter = {
      foo: 'bar'
    };

    var result = configReader.getConfig();

    expect(getReporterConfigStub).to.have.been.calledOnce;
    expect(getReporterConfigStub).to.have.been.calledWith();

    expect(initStub).to.have.been.calledOnce;
    expect(initStub).to.have.been.calledWith();

    expect(requireStub).to.have.been.calledWith('../reporters');

    expect(reporters.trace.create).to.have.been.calledOnce;
    expect(reporters.trace.create).to.have.been.calledWith(reporterConfig);

    expect(result).to.be.eql(defaults({}, collectorConfig, config));
  });

  it('should throw readable error in case of no appName', function () {
    var collectorConfig = {
      reporterType: 'trace',
      reporterConfig: 'foo'
    };

    var config = {};

    var reporterConfig = {
      foo: 'bar'
    };

    var configReader = ConfigReader.create(collectorConfig);
    var getReporterConfigStub = this.sandbox.stub(configReader, '_getReporterConfig', function () {
      return reporterConfig;
    });

    var initStub = this.sandbox.stub(configReader, '_initConfig', function () {
      return config;
    });

    var reporters = {
      trace: {
        create: this.sandbox.spy(function () {
          return reporter;
        })
      }
    };

    var requireStub = this.sandbox.stub(configReader, '_require', function () {
      return reporters;
    });

    var reporter = {
      foo: 'bar'
    };

    try {
      configReader.getConfig();
    } catch (ex) {
      expect(ex).to.be.eql(new Error('Missing appName'));
      expect(getReporterConfigStub).to.have.been.calledOnce;
      expect(getReporterConfigStub).to.have.been.calledWith();

      expect(initStub).to.have.been.calledOnce;
      expect(initStub).to.have.been.calledWith();

      expect(requireStub).to.have.been.calledWith('../reporters');

      expect(reporters.trace.create).to.have.been.calledOnce;
      expect(reporters.trace.create).to.have.been.calledWith(reporterConfig);
      return;
    }

    throw new Error('Error should have been thrown');
  });

  it('gets the config', function () {
    var reporter = {};
    var collectorConfig = {};

    var config = {
      appName: 'app',
      reporter: reporter
    };

    var configReader = ConfigReader.create(collectorConfig);

    var initStub = this.sandbox.stub(configReader, '_initConfig', function () {
      return config;
    });

    var result = configReader.getConfig();

    expect(initStub).to.have.been.calledOnce;
    expect(initStub).to.have.been.calledWith();

    expect(result).to.be.eql(defaults({}, collectorConfig, config));
    expect(reporter.appName).to.be.eql(config.appName);
  });

});
