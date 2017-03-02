/**
 * Your Trace configuration file
 */
'use strict'

module.exports = {
  serviceName: 'your-awesome-app',
  apiKey: 'KEEP.ME.SECRET',
  ignoreHeaders: {
    'user-agent': ['007']
  },
  ignorePaths: [
    '/healtcheck'
  ],
  ignoreStatusCodes: [
    401,
    403
  ]
}
