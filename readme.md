# seetru

## Installation

```javascript
var seetru = require('seetru')({
    app: 'APP_NAME',
    service: 3
})
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
