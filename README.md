![Trace logo](https://s3-eu-west-1.amazonaws.com/risingstack-resources/trace_by_risingstack.png)

[![Build status](https://img.shields.io/circleci/project/github/RisingStack/trace-nodejs.svg)](https://circleci.com/gh/RisingStack/trace-nodejs)
[![npm version](https://img.shields.io/npm/v/@risingstack/trace.svg)](https://www.npmjs.com/package/@risingstack/trace)
[![Website](https://img.shields.io/website-up-down-green-red/https/trace.risingstack.com.svg)](https://trace.risingstack.com)
[![Slack Status](https://trace-slack.risingstack.com/badge.svg)](https://trace-slack.risingstack.com)
[![Twitter URL](https://img.shields.io/twitter/url/https/trace.risingstack.com.svg?style=social)](https://twitter.com/TraceAPM)
***
[App](https://trace.risingstack.com/app) | [Documentation](https://trace-docs.risingstack.com/) | [Status page](https://trace-status.risingstack.com/) | [Case study](https://blog.risingstack.com/case-study-node-js-memory-leak-in-ghost/)
***

## ⚠️ Breaking change

With version 3.x.x we have dropped support for Node v0.10. This means that
future releases under this major version might contain code changes that are
incompatible with Node.js v0.10 to an extent of crashing your application.
Please consider updating to a newer runtime, especially that the
[maintenance of v0.10 has already ended](node-lts). See our compatibility table
below.

Also, since 3.1.0 we switched to a different API backend for collecting traces
which is incompatible with the old one. The old endpoint is still supported, but
we would like it to be phased out eventually. Please update your agents to
3.1.0 or newer.

## Installation and usage

As Trace uses scoped packages, be sure to use npm version greater than 2.7.0.

```
npm install --save @risingstack/trace
```

> ⚠️ 

>Trace depends on a couple of native addons. We host precompiled
binaries of these for Linux and Darwin 64-bit platforms at https://oss.risingstack.com. 
The installer will attempt to download these dependencies, so it should be allowed 
through your firewall, or else the download will fail and the installer will fall back
to building from source. This also happens if there isn't a precompiled binary for your platform. Note that compiling native addons requires native toolchain.

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
  proxy: 'http://168.63.76.32:3128',
  keepQueryParams: true
}
```

For the complete set of configuration options, visit the [docs](https://trace-docs.risingstack.com/docs/advanced-usage#section-available-options).


> ⚠️ 

>If you are running your app with NODE_ENV=test, Trace won't start

## API

### trace.report(name, object)

This method can be use to report additional data to the Trace servers which later on helps with debugging.

```javascript
trace.report('name', {
  userId: 10
});
```

Throws an error if first parameter is not a String.
Throws an error if second parameter is not an Object.

### trace.reportError(name, error)

This method can be used to send errors to the Trace servers.

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

### trace.stop([cb])

This method gracefully stops trace.

```javascript
trace.stop(cb)
```
Accepts a node-style callback to be called when trace stopped.

Note: There is no way to restart trace after calling this method. You should end your process after calling this
method.

## Troubleshooting

### Debug logs
If you have problems using Trace, e.g it doesn't seem to report anything you can
turn on logging. We use the lightweight
[debug](https://github.com/visionmedia/debug). If you are not familiar with it
yet, please read its documentation to learn how it works.


#### Quickstart
To turn it only for Trace start your app with the `DEBUG`
environment variable set to `risingstack/trace*`.

```
DEBUG=risingstack/trace* node my_app.js
```

#### Configure logging

To make it possible to filter severities and components in Trace we use
subnamespaces. The namespace will start with `trace/risingstack` then a `:` then
a mandatory severity specifier,
- `error`,
- `warn` or
- `info`.

Then come zero or more namespaces led by colons. The namespaces are
hierarchically organized according to components inside of Trace.

Currently these namespaces (and their subnamespaces) are used:

- `config`
- `instrumentation`
- `agent`
- `agent:tracer`
- `agent:metrics`
- `agent:profiler`
- `agent:security`
- `api`

As they can have subnamespaces, always append an `*` to them to get all
messages.

Examples:

- get all error messages: `DEBUG=risingstack/trace:error*`

- get all messages from agents: `DEBUG=risingstack/trace:*:agent*`

- get all error messages and all messages from agents: `DEBUG=risingstack/trace:error*,risingstack/trace:*:agent*`


## Compatibility with Node versions

* node v0.12
* node v4
* node v5
* node v6
* node v7

## Migrating from previous versions

### Versions below 2.x

The `trace.config.js` file changed, and has the following format:

```
module.exports = {
  serviceName: 'your-awesome-app',
  apiKey: 'KEEP_ME_SECRET'
}
```

Also, from `2.x` you can specify these values using only environment variables: `TRACE_SERVICE_NAME` and `TRACE_API_KEY`.

Custom reporters are no longer supported in trace 2.x*

### Versions below 3.x

We dropped support for Node v0.10. [Update your runtime](node) to a more recent version to continue using Trace.

[node]: https://nodejs.org/en/
[node-lts]: https://github.com/nodejs/LTS#lts-schedule
