/**
 * Your Trace configuration file
 */

 module.exports = {
   serviceName: 'your-awesome-app',
   apiKey: 'super-secret', // you can override this with the TRACE_API_KEY environment variable
   ignoreHeaders: {
     'user-agent': ['007']
   }
 }
