'use strict'
var childProcess = require('child_process')
var fs = require('fs')
var debug = require('../../utils/debug')('agent:security')
var format = require('util').format
var yaml = require('js-yaml')
var forEach = require('lodash.foreach')
var uniq = require('lodash.uniq')
var inherits = require('util').inherits
var Agent = require('../agent')

var MAX_BUFFER = 1024 * 1024 // 1 mb

function Security (options) {
  this.collectorApi = options.collectorApi
  Agent.call(this, 'Security')
}

inherits(Security, Agent)

Security.prototype.initialize = function () {
  this.sendDependencies()
}

Security.prototype.collectSnykFlags = function collectSnykFlags (callback) {
  fs.readFile('.snyk', function (error, data) {
    if (error) {
      // .snyk file is not present, not an error
      callback(null, [])
      return
    }

    var patch
    try {
      patch = yaml.safeLoad(data).patch
    } catch (ex) {
      debug.error('collectSnykFlags', format('error collecting snyk flags: %s', ex.stack))
      callback(null, [])
      return
    }

    // no patches
    if (!patch || !Object.keys(patch).length) {
      callback(null, [])
      return
    }

    var patchedVulnIds = Object.keys(patch)
    var packageNames = patchedVulnIds
      .map(function (patch) {
        return patch.split(':')[1]
      })

    childProcess.execFile('npm', ['ls'].concat(uniq(packageNames)).concat(['--parseable', '--long']), {
      maxBuffer: MAX_BUFFER
    }, function (_error, stdout, stderr) {
      if (_error) {
        // ignore
        debug.error('collectSnykFlags',
          format('`npm ls <package_names> --long --parseable` returned error: %s', _error.stack))
      }

      var pkgs = stdout.split('\n')
        .filter(function (string) {
          return string !== ''
        })
        .map(function (pkg) {
          return {
            nameWithVersion: pkg.split(':')[1].trim(),
            path: pkg.split(':')[0].trim()
          }
        })

      var flags = {}
      var pending = pkgs.length
      pkgs.forEach(function (pkg) {
        flags[pkg.nameWithVersion] = []

        // read dependency directory
        fs.readdir(pkg.path, function (__error, files) {
          if (__error) {
            pending -= 1
            return
          }

          var vulnIds = files
            // filter snyk flag files
            .filter(function (file) {
              return /.snyk-.*-\d*.flag/.test(file)
            })
            // turn them into vulnIds
            .map(function (file) {
              return file.split(/-|\./g)
                .filter(function (string) {
                  return string !== ''
                })
                .slice(1, 4)
                .join(':')
            })
            // filter for patched vulnIds
            .filter(function (fileVulnId) {
              return patchedVulnIds.indexOf(fileVulnId) > -1
            })

          Array.prototype.push.apply(flags[pkg.nameWithVersion], vulnIds)

          pending -= 1
          if (!pending) {
            callback(null, flags)
          }
        })
      })
    })
  })
}

Security.prototype.collectDependencies = function collectDependencies (callback) {
  childProcess.execFile('npm', ['ls', '--json', '--production'], {
    maxBuffer: MAX_BUFFER
  }, function (error, stdout, stderr) {
    if (error) {
      // ignore
    }

    var parsedDependencies
    try {
      parsedDependencies = JSON.parse(stdout).dependencies

      if (!parsedDependencies) {
        callback(new Error('`npm ls --json --production` returned with no dependencies'))
        return
      }
    } catch (ex) {
      callback(ex)
      return
    }

    callback(null, parsedDependencies)
  })
}

Security.prototype.sendDependencies = function sendDependencies () {
  var self = this
  this.collectDependencies(function (error, dependencies) {
    if (error) {
      debug.error('sendDependencies', format('error collecting dependencies: %s', error.stack))
      return
    }

    self.collectSnykFlags(function (_error, flags) {
      if (_error) {
        debug.error('sendDependencies', format('error collecting snyk flags: %s', _error.stack))
        // send dependencies without patches
        self.collectorApi.sendDependencies(dependencies)
        return
      }

      forEach(dependencies, function (dependency, packageName) {
        addPatchesToDependency(dependency, packageName, flags)
      })

      self.collectorApi.sendDependencies(dependencies)
    })
  })

  function addPatchesToDependency (dependency, packageName, flags) {
    if (dependency.dependencies) {
      forEach(dependency.dependencies, function (subDependency, subPackageName) {
        addPatchesToDependency(subDependency, subPackageName, flags)
      })
    }

    var patches = flags[packageName + '@' + dependency.version]
    if (patches) {
      dependency.patches = patches
    }
  }
}

function create (options) {
  return new Security(options)
}

module.exports.create = create
