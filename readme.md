# seetru

## Installation

```javascript
var seetru = require('seetru');
```

### Config file

A config file should be present at the project root. You have to specify a `reporter`, which implement a `send` method to send the traced requests to the RisingTrace server or to your Logstash or any other storage. If you choose  to use our service, you need to specify an api key, in case of you want to use your logstash, you have to add the connection informations. An example for the `risingtrace.config.js` config file the RisingTrace server:

```javascript
/**
* The RisingTrace configuration file
*/

var config = {};

config.appName = 'Users';

config.reporter = require('seetru/lib/reporters').trace.create({
 apiKey: '1234',
 appName: config.appName
});

module.exports = config;
```

An example for logstash config:
```javascript
/**
* The RisingTrace configuration file
*/

var config = {};

config.appName = 'Users';

config.reporter = require('seetru/lib/reporters').logstash.create({
  type: 'tcp',
  host: 'localhost',
  port: 12201
});

module.exports = config;
```

** NOTE: THIS IS SUBJECT TO CHANGE PRETTY SOON **

## API

### seetru.report(Object)

This method can be use to report additional data to the Seetru servers which later on helps with debugging.

```javascript

seetrue.report({
  userId: 10
});
```

## Readings

http://www.slideshare.net/othiym23/cls-asynclistener-asynchronous-observability-for-nodejs
