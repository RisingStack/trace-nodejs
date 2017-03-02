'use strict'
var hashes = [
  'hdel',
  'hexists',
  'hget',

  'hgetall',
  'hincrby',
  'hincrbyfloat',

  'hkeys',
  'hlen',
  'hmget',

  'hmset',
  'hset',
  'hsetnx',

  'hstrlen',
  'hvals',
  'hscan'
]

var hloglogs = [
  'pfadd',
  'pfcount',
  'pfmerge'
]

var geo = [
  'geoadd',
  'geohash',
  'geopos',

  'geodist',
  'georadius',
  'georadiusbymember'
]

var keys = [
  'del',
  'dump',
  'exists',

  'expire',
  'expireat',
  'keys',

  'migrate',
  'move',
  'object',

  'persist',
  'pexpire',
  'pexpireat',

  'pttl',
  'randomkey',
  'rename',

  'renamenx',
  'restore',
  'sort',

  'ttl',
  'type',
  'wait',

  'scan'

]

var lists = [
  'blpop',
  'brpop',
  'brpoplpush',

  'lindex',
  'linsert',
  'llen',

  'lpop',
  'lpush',
  'lpushx',

  'lrange',
  'lrem',
  'lset',

  'ltrim',
  'rpop',
  'rpoplpush',

  'rpush',
  'rpushx'

]

var sets = [
  'sadd',
  'scard',
  'sdiff',

  'sdiffstore',
  'sinter',
  'sinterstore',

  'sismember',
  'smembers',
  'smove',

  'spop',
  'srandmember',
  'srem',

  'sunion',
  'sunionstore',
  'sscan'

]

var sortedSets = [
  'zadd',
  'zcard',
  'zcount',

  'zincrby',
  'zinterstore',
  'zlexcount',

  'zrange',
  'zrangebylex',
  'zrevrangebylex',

  'zrangebyscore',
  'zrank',
  'zrem',

  'zremrangebylex',
  'zremrangebyrank',
  'zremrangebyscore',

  'zrevrange',
  'zrevrangebyscore',
  'zrevrank',

  'zscore',
  'zunionstore',
  'zscan'

]

var strings = [
  'append',
  'bitcount',
  'bitop',

  'bitpos',
  'decr',
  'decrby',

  'get',
  'getbit',
  'getrange',

  'getset',
  'incr',
  'incrby',

  'incrbyfloat',
  'mget',
  'mset',

  'msetnx',
  'psetex',
  'set',

  'setbit',
  'setex',
  'setnx',

  'setrange',
  'strlen'

]

module.exports = {
  instrumentedCommands: {
    hashes: hashes,
    hloglogs: hloglogs,
    geo: geo,
    keys: keys,
    lists: lists,
    sets: sets,
    sortedSets: sortedSets,
    strings: strings
  }
}
