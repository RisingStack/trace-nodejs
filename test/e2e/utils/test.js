var defaultsDeep = require('lodash.defaultsdeep')
var tape = require('tape')
var spawnSync = require('child_process').spawnSync
var spawnSyncFallback = require('spawn-sync')
var crypto = require('crypto')

/*
* Wrapper around tape.
* Top-level tests can have the option `isolate: 'child-process'` which forks the node process and runs that sole test
* (including child tests) to run on in a child process. Pass child process options in options.childProcessOpts.
*/

function getTestArgs (name_, opts_, cb_) {
  var name = '(anonymous)'
  var opts = {}
  var cb

  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i]
    var t = typeof arg
    if (t === 'string') {
      name = arg
    } else if (t === 'object') {
      opts = arg || opts
    } else if (t === 'function') {
      cb = arg
    }
  }
  return { name: name, opts: opts, cb: cb }
}

function childProcessTest (name_, opts_, cb_, args, fn) {
  if (args.name !== '(anonymous)' && process.env.TEST_NAME === args.name) {
    fn(name_, opts_, cb_)
  } else if (args.name === '(anonymous)') { // maybe overkill, but on anonymous tests, use the function hash as id
    var sha1 = crypto.createHash('sha1')
    sha1.update(String(args.cb))
    if (sha1.digest() === process.env.TEST_NAME) {
      fn(name_, opts_, cb_)
    }
  }
}

function test (name_, opts_, cb_) {
  var args = getTestArgs(name_, opts_, cb_)
  if (args.skip) {
    test.skip(name_, opts_, cb_)
  } else if (args.only) {
    test.only(name_, opts_, cb_)
  } else if (process.env.TEST_ISOLATE === 'child-process') {
    childProcessTest(name_ + ' (child process running in ' + process.pid + ')', opts_, cb_, args, tape.only)
  } else {
    if (args.opts.isolate === 'child-process') {
      tape(name_, defaultsDeep(opts_, { timeout: 10000 }), function (t) {
        var testName
        if (args.name !== '(anonymous)') {
          testName = args.name
        } else {
          var sha1 = crypto.createHash('sha1')
          sha1.update(String(args.cb))
          testName = sha1.digest()
        }
        var childEnv = defaultsDeep({
          TEST_NAME: testName,
          TEST_ISOLATE: 'child-process'
        }, process.env)
        var res
        if (spawnSync) {
          try {
            res = spawnSync(process.argv[0], process.argv.slice(1), defaultsDeep(
              { stdio: ['ignore', process.stdout, process.stderr] },
              args.opts.childProcessOpts,
              { env: childEnv })
            )
          } catch (err) {
            t.fail('child process thrown exception: ' + err)
          }
        } else {
          try {
            res = spawnSyncFallback(process.argv[0], process.argv.slice(1), defaultsDeep(
              { stdio: ['ignore', 'pipe', 'ignore'] },
              args.opts.childProcessOpts,
              { env: childEnv })
            )
            process.stdout.write(res.stdout) // very performant
          } catch (err) {
            t.fail('child process thrown exception: ' + err)
          }
        }
        if (res.status !== 0) {
          t.fail('child process failed with ' + res.status)
        } else {
          t.pass('child process succeeded')
        }
        t.end()
      })
    } else {
      tape(name_, opts_, cb_)
    }
  }
}

test.skip = function (name_, opts_, cb_) {
  var args = getTestArgs(name_, opts_, cb_)
  if (process.env.TEST_ISOLATE === 'child-process') {
    childProcessTest(name_, opts_, cb_, args, tape.skip)
  } else {
    tape.skip(name_, opts_, cb_)
  }
}

test.only = function (name_, opts_, cb_) {
  var args = getTestArgs(name_, opts_, cb_)
  if (process.env.TEST_ISOLATE === 'child-process') {
    childProcessTest(name_, opts_, cb_, args, tape.only)
  } else {
    tape.only(name_, opts_, cb_)
  }
}

defaultsDeep(test, tape.test)
module.exports = test
module.exports.test = module.exports
defaultsDeep(module.exports, tape)
