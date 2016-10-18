var expect = require('chai').expect
var childProcess = require('child_process')
var fs = require('fs')

var Security = require('./')

describe('The Security module', function () {
  it('sends dependencies including patches', function () {
    var dependencies = {
      vuln: {
        version: '1.0.0',
        dependencies: {
          'not-vuln': {
            version: '1.1.0'
          }
        }
      },
      'not-vuln': {
        version: '1.5.0'
      }
    }

    var collectorApi = {
      sendDependencies: this.sandbox.spy()
    }

    this.sandbox.stub(fs, 'readFile', function (file, callback) {
      if (file === '.snyk') {
        callback(null, new Buffer(
          'version: v9.9.9\n' +
          'patch:\n' +
          "  'npm:vuln:19930926':\n" +
          '    - vuln:\n' +
          "        patched: '2016-09-26T02:00:00.000Z'"
        ))
        return
      }

      callback(new Error('not implemented'))
    })

    this.sandbox.stub(childProcess, 'execFile', function (cmd, args, opts, callback) {
      if (typeof opts === 'function') {
        callback = opts
      }

      if (args.indexOf('--json') > -1) {
        callback(null, JSON.stringify({ dependencies: dependencies }))
        return
      } else if (args.indexOf('--parseable') > -1) {
        callback(null, '/project/node_modules/vuln:vuln@1.0.0:undefined\n')
        return
      }

      callback(new Error('not implemented'))
    })

    this.sandbox.stub(fs, 'readdir', function (dir, callback) {
      if (dir === '/project/node_modules/vuln') {
        callback(null, [
          'package.json',
          '.snyk-npm-vuln-19930926.flag',
          '.snyk-npm-vuln-19930927.flag'
        ])
        return
      }

      callback(null, ['package.json'])
    })

    var security = Security.create({
      collectorApi: collectorApi
    })

    security.initialize()

    expect(fs.readFile).to.have.been.calledWithMatch('.snyk')
    expect(fs.readdir).to.have.been.calledWithMatch('/project/node_modules/vuln')
    expect(childProcess.execFile).to.have.been.calledWithMatch('npm', ['ls', 'vuln', '--parseable', '--long'])
    expect(childProcess.execFile).to.have.been.calledWithMatch('npm', ['ls', '--json', '--production'])
    expect(collectorApi.sendDependencies).to.have.been.calledWith({
      vuln: {
        version: '1.0.0',
        patches: ['npm:vuln:19930926'],
        dependencies: {
          'not-vuln': {
            version: '1.1.0'
          }
        }
      },
      'not-vuln': {
        version: '1.5.0'
      }
    })
  })

  it('sends dependencies without patches if the .snyk policy file is not present', function () {
    var dependencies = {
      vuln: {
        version: '1.0.0',
        dependencies: {
          'not-vuln': {
            version: '1.1.0'
          }
        }
      },
      'not-vuln': {
        version: '1.5.0'
      }
    }

    var collectorApi = {
      sendDependencies: this.sandbox.spy()
    }

    this.sandbox.stub(fs, 'readFile', function (file, callback) {
      callback(new Error('ENOENT'))
    })

    this.sandbox.stub(childProcess, 'execFile', function (cmd, args, opts, callback) {
      if (args.indexOf('--json') > -1) {
        callback(null, JSON.stringify({ dependencies: dependencies }))
        return
      }

      callback(new Error('not implemented'))
    })

    var security = Security.create({
      collectorApi: collectorApi
    })

    security.initialize()

    expect(fs.readFile).to.have.been.calledWithMatch('.snyk')
    expect(childProcess.execFile).to.have.been.calledWithMatch('npm', ['ls', '--json', '--production'])
    expect(collectorApi.sendDependencies).to.have.been.calledWith(dependencies)
  })

  it('sends dependencies without patches if the .snyk policy file is an invalid YAML', function () {
    var dependencies = {
      vuln: {
        version: '1.0.0',
        dependencies: {
          'not-vuln': {
            version: '1.1.0'
          }
        }
      },
      'not-vuln': {
        version: '1.5.0'
      }
    }

    var collectorApi = {
      sendDependencies: this.sandbox.spy()
    }

    this.sandbox.stub(fs, 'readFile', function (file, callback) {
      if (file === '.snyk') {
        callback(null, new Buffer(
          'version: v9.9.9\n' +
          'patch:\n;[]'
        ))
        return
      }

      callback(new Error('not implemented'))
    })

    this.sandbox.stub(childProcess, 'execFile', function (cmd, args, opts, callback) {
      if (args.indexOf('--json') > -1) {
        callback(null, JSON.stringify({ dependencies: dependencies }))
        return
      }

      callback(new Error('not implemented'))
    })

    var security = Security.create({
      collectorApi: collectorApi
    })

    security.initialize()

    expect(fs.readFile).to.have.been.calledWithMatch('.snyk')
    expect(childProcess.execFile).to.have.been.calledWithMatch('npm', ['ls', '--json', '--production'])
    expect(collectorApi.sendDependencies).to.have.been.calledWith(dependencies)
  })

  it('sends dependencies without patches if the .snyk policy file does not contain the patch object', function () {
    var dependencies = {
      vuln: {
        version: '1.0.0',
        dependencies: {
          'not-vuln': {
            version: '1.1.0'
          }
        }
      },
      'not-vuln': {
        version: '1.5.0'
      }
    }

    var collectorApi = {
      sendDependencies: this.sandbox.spy()
    }

    this.sandbox.stub(fs, 'readFile', function (file, callback) {
      if (file === '.snyk') {
        callback(null, new Buffer(
          'version: v9.9.9\n' +
          'ignore: {}'
        ))
        return
      }

      callback(new Error('not implemented'))
    })

    this.sandbox.stub(childProcess, 'execFile', function (cmd, args, opts, callback) {
      if (args.indexOf('--json') > -1) {
        callback(null, JSON.stringify({ dependencies: dependencies }))
        return
      }

      callback(new Error('not implemented'))
    })

    var security = Security.create({
      collectorApi: collectorApi
    })

    security.initialize()

    expect(fs.readFile).to.have.been.calledWithMatch('.snyk')
    expect(childProcess.execFile).to.have.been.calledWithMatch('npm', ['ls', '--json', '--production'])
    expect(collectorApi.sendDependencies).to.have.been.calledWith(dependencies)
  })
})
