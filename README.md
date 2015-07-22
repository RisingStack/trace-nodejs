# Trace

![Trace logo](https://cloud.githubusercontent.com/assets/1764512/8827915/babae4fe-308f-11e5-8087-ac24bb9c8a3d.png)

## Installation and usage

```
npm install --save @risingstack/trace
```

After you installed Trace as a dependency, you just require it at the beginning of your main file.
```javascript
var trace = require('@risingstack/trace');
```

### Config file

A config file should be present at the project root. You have to specify a `reporter`,
which implements a `send` method to send the traced requests to the Trace servers
or to your Logstash or any other storage.

If you choose to use our service, you need to specify an api key.

In case you want to use your Logstash, you have to add the connection informations.
An example for the `trace.config.js` config file using the Trace servers:

```javascript
/**
* The Trace configuration file
*/

var config = {};

config.appName = 'Users';

config.reporter = require('@risingstack/trace/lib/reporters').trace.create({
 apiKey: '1234',
 appName: config.appName
});

module.exports = config;
```

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

## Compatibility with Node versions

* v0.10@latest
* v0.12@latest
* iojs@latest

## Supported HTTP Client libraries

* native HTTP/HTTPS clients
* [request](https://github.com/request/request)
* [superagent](https://github.com/visionmedia/superagent)
* more coming soon!
