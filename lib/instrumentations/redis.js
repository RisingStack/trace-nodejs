var Shimmer = require('../utils/shimmer')

module.exports = function (redis, ns) {
  Shimmer.wrap(redis.RedisClient.prototype, 'redis.RedisClient.prototype', 'send_command', function (original) {
    return function (fulfill, reject, progress, promise, receiver, domain) {
      var args = Array.prototype.slice.apply(arguments)
      var last = args.length - 1
      var callback = args[last]
      var tail = callback

      if (typeof callback === 'function') {
        args[last] = ns.bind(callback)
      } else if (Array.isArray(tail) && typeof tail[tail.length - 1] === 'function') {
        last = tail.length - 1
        tail[last] = ns.bind(tail[last])
      }

      return original.apply(this, args)
    }
  })

  return redis
}
