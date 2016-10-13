var expect = require('chai').expect
var childProcess = require('child_process')

var Security = require('./')

describe('The Security module', function () {
  it('sends dependencies', function () {
    var dependencies = { package: { name: 'name' } }
    var collectorApi = {
      sendDependencies: this.sandbox.spy()
    }

    this.sandbox.stub(childProcess, 'execFile', function (cmd, args, opts, callback) {
      callback(null, JSON.stringify({ dependencies: dependencies }))
    })

    var security = Security.create({
      collectorApi: collectorApi
    })

    security.timer.start()

    expect(childProcess.execFile).to.have.been.calledWithMatch('npm', ['ls', '--json', '--production'])
    expect(collectorApi.sendDependencies).to.have.been.calledWith(dependencies)
  })
})
