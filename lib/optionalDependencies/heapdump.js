var heapdump

try {
  heapdump = require('heapdump')
} catch (ex) {
  console.error('error: [trace]', 'heapdump couldn\'t be required, possibly a compiler issue - continuing')
  heapdump = {
    writeSnapshot: function (path, cb) {
      cb()
    }
  }
}

module.exports = heapdump
