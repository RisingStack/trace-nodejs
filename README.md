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

You have to specify a `reporter`, which implements a `send` method to send the traced requests to the Trace servers or to your Logstash or any other storage.

If you choose to use our service, you need to specify an api key.

In case you want to use your Logstash, you have to add the connection informations.

You can specify these informations two ways. Either via environment variables or using an optional config module. We look for a config module named `trace.config.js` at your current working directory by default, which can be overridden with the `TRACE_CONFIG_PATH` environment variable. 

An example for how to start your app without a config file:

```
node TRACE_APP_NAME=MyApp TRACE_API_KEY=1 index.js
```

An example with a custom config file using the Trace servers:

```
node TRACE_CONFIG_PATH=/path/to/my/config.js index.js
```

```javascript
/**
* The Trace configuration file
*/

var config = {};

config.appName = 'Users';

config.ignoreHeaders = {
  'user-agent': ['007']
};

config.reporter = require('@risingstack/trace/lib/reporters').trace.create({
 apiKey: '1234',
 appName: config.appName
});

module.exports = config;
```

**Here please pay special attention to the `ignoreHeaders` option. With this, you can specify which requests should not be accounted. This can be extremely useful if you want to filter out the noise generated by your health checks for example.**


An example for Logstash config:
```javascript
/**
* The Trace configuration file
*/

var config = {};

config.appName = 'Users';

config.reporter = require('@risingstack/trace/lib/reporters').logstash.create({
  type: 'tcp',
  host: 'localhost',
  port: 12201
});

module.exports = config;
```

## API

### trace.report(Object)

This method can be use to report additional data to the Trace servers which later on helps with debugging.

```javascript
trace.report({
  userId: 10
});
```

Returns an error if parameter is not an Object.

### trace.getTransactionId()

This method can be use to get the current transactionId. It can be useful if you want to integrate trace with your
current logging systems.

```javascript
var transactionId = trace.getTransactionId();
```


## Compatibility with Node versions

* node v0.10@latest
* node v0.12@latest
* iojs v2@latest
* iojs v3@latest
* node v4@latest

## Supported HTTP Client libraries

* native HTTP/HTTPS clients
* [request](https://github.com/request/request)
* [superagent](https://github.com/visionmedia/superagent)
* more coming soon!
