var childProcess = require('child_process')
var debug = require('debug')('risingstack/trace')

function Security (options) {
  this.name = 'Security'
  this.collectorApi = options.collectorApi

  var self = this

  this.timer = {
    start: function () { self.sendDependencies() },
    restart: function () { /* noop */ },
    end: function () { /* noop */ }
  }
}

Security.prototype.collectDependencies = function (callback) {
  var maxBuffer = 10 * 1024 * 1024 // 10mb
  childProcess.execFile('npm', ['ls', '--json', '--production'], {
    maxBuffer: maxBuffer
  }, function (error, stdout, stderr) {
    if (error) {
      // ignore
    }

    var parsedDependencies
    try {
      parsedDependencies = JSON.parse(stdout).dependencies

      if (!parsedDependencies) {
        return callback(new Error('`npm ls --json --production` returned with no dependencies'))
      }
    } catch (ex) {
      return callback(ex)
    }

    return callback(null, parsedDependencies)
  })
}

Security.prototype.sendDependencies = function () {
  var _this = this
  this.collectDependencies(function (error, dependencies) {
    if (error) {
      debug('error collecting dependencies', error)
      return
    }

    _this.collectorApi.sendDependencies(dependencies)
  })
}

function create (options) {
  return new Security(options)
}

module.exports.create = create
