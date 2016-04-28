/**
 * Your Trace configuration file
 */

 module.exports = {
   serviceName: 'your-awesome-app',
   apiKey: 'KEEP_ME_SECRET',
   ignoreHeaders: {
     'user-agent': ['007']
   },
   ignorePaths: [
     '/healtcheck'
   ]
 }
