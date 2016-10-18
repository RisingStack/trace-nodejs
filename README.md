![Trace logo](https://cloud.githubusercontent.com/assets/1764512/8830445/83e8263c-309c-11e5-9f7f-aa3420e9b2f0.png)
***
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
[ ![Codeship Status for RisingStack/trace-nodejs](https://codeship.com/projects/8322f860-3ac7-0133-8753-0e111daba52d/status?branch=master)](https://codeship.com/projects/101987)

## Installation and usage

As Trace uses scoped packages, be sure to use npm version greater than 2.7.0.

```
npm install --save @risingstack/trace
```

*If you can't update to npm@2.7.0 for whatever reason, you can still install Trace using `npm i risingstack/trace-nodejs`.*

After you installed Trace as a dependency, you just require it at the beginning of your main file.
```javascript
var trace = require('@risingstack/trace');
```

### Configuration

You can specify the configuration two ways. Configuration options can be set via environment variables or using a config module. We look for a config module named `trace.config.js` at your current working directory by default, which can be overridden with the `TRACE_CONFIG_PATH` environment variable. Having a config module is optional, but some options may be set only with it. In order to use our service, you need to specify an api key and and a service name at minimum. The corresponding environment variables are: `TRACE_API_KEY` and `TRACE_SERVICE_NAME`.

An example for how to start your app with environment variables:

```
node TRACE_SERVICE_NAME=MyApp TRACE_API_KEY=1 index.js
```

An example with a custom config file using the Trace servers:

```
node TRACE_CONFIG_PATH=/path/to/my/config.js index.js
```

or simply


```
node index.js
```

if it's in the current working directory.

```javascript
/**
* Your Trace configuration file at /path/to/my/config.js
*/

module.exports = {
  serviceName: 'your-awesome-app',
  apiKey: 'KEEP_ME_SECRET',
  ignoreHeaders: {
    'user-agent': ['007']
  },
  ignorePaths: [
    '/healthcheck'
  ],
  ignoreStatusCodes: [
    401,
    404
  ],
  ignoreOutgoingHosts: [
    'google.com'
  ],
  disableInstrumentations: [
    'mongodb'
  ],
  proxy: 'http://168.63.76.32:3128'
}
```

*Note: Custom reporters are no longer supported in trace 2.x*

*Note: If you are running your app with NODE_ENV=test, Trace won't start*

## API

### trace.report(String, [Object])

This method can be use to report additional data to the Trace servers which later on helps with debugging.

```javascript
trace.report('name', {
  userId: 10
});
```

Throws an error if first parameter is not a String.
Throws an error if second parameter is not an Object.

### trace.reportError(String, Error)

This method can be used to send errors to the Trace servers - note that transactions that use
this method are not subject to sampling, so it will be collected all the time.

```javascript
trace.reportError('mysql_error', new Error('connection refused'));
```

Throws an error if first parameter is not a String.

### trace.getTransactionId()

This method can be use to get the current transactionId. It can be useful if you want to integrate trace with your
current logging systems.

```javascript
var transactionId = trace.getTransactionId();
```

### trace.recordMetric(name, value)

This method can be used to record custom metrics values.

```javascript
trace.recordMetric('user/imageUpload', 6)
```

The name must have the following format: `<Category>/<Name>`
The value must be a number.

### trace.incrementMetric(name, [amount])

This method can be used to record increment-only type of metrics.

```javascript
trace.incrementMetric('user/signup')
```

The name must have the following format: `<Category>/<Name>`

### trace.stop()

This method gracefully stops trace.

```javascript
trace.stop(cb)
```
Accepts a node-style callback to be called when trace stopped.

Note: There is no way to restart trace after calling this method. You should end your process after calling this
method.

## Compatibility with Node versions

* node v0.10@latest
* node v0.12@latest
* node v4@latest
* node v5@latest
* node v6@latest

## Migrating from 1.x to 2.x

The `trace.config.js` file changed, and has the following format:

```
module.exports = {
  serviceName: 'your-awesome-app',
  apiKey: 'KEEP_ME_SECRET'
}
```

Also, from `2.x` you can specify these values using only environment variables: `TRACE_SERVICE_NAME` and `TRACE_API_KEY`.
