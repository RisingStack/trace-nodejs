var mongooseCls = require('./mongoose')

// patching most commonly used node modules
module.exports = function (session) {
  // patching mongoose
  try {
    mongooseCls(session)
  } catch (ex) {}
}
