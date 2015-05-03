# seetru

## Installation

```javascript
var seetru = require('seetru');
```

### Config file

A config file should be present at the project root: `risingtrace.config.js`:

```
/*
* The RisingTrace configuration file
* */

module.exports = {
  appName: 'Users',
  licenceKey: '1234'
};

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
