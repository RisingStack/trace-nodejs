'use strict'

var os = require('os')
var _ = require('lodash')

function systemInfo () {
  return {
    machine: {
      arch: process.arch,
      platform: process.platform,
      release: os.release(),
      hostname: os.hostname(),
      cpus: _.map(os.cpus(), function (cpu) {
        delete cpu.times
        return cpu
      })
    },
    runtime: {
      name: process.title,
      version: process.version
    }
  }
}

module.exports = systemInfo
