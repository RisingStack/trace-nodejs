### Deprecated

#### Newer releases can be found here: https://github.com/RisingStack/trace-nodejs/releases

<a name="2.2.0"></a>
# [2.2.0](https://github.com/RisingStack/trace-nodejs/compare/v2.2.0...v2.2.0) (2016-02-16)




<a name="2.2.0"></a>
# [2.2.0](https://github.com/RisingStack/trace-nodejs/compare/v2.1.4...v2.2.0) (2016-02-16)


### Features

* **config:** expose ignoreHeaders option to commandline ([0b3d21e](https://github.com/RisingStack/trace-nodejs/commit/0b3d21e))



<a name="2.1.4"></a>
## [2.1.4](https://github.com/RisingStack/trace-nodejs/compare/v2.1.3...v2.1.4) (2016-02-15)


### Bug Fixes

* **event-loop:** get values from libuv ([dfd50db](https://github.com/RisingStack/trace-nodejs/commit/dfd50db))
* **http:** worker requests ([00d4f6c](https://github.com/RisingStack/trace-nodejs/commit/00d4f6c))
* **http-metrics:** adding median and 95th ([a22c584](https://github.com/RisingStack/trace-nodejs/commit/a22c584))

### Features

* **metrics:** adding more detailed metrics ([30925b0](https://github.com/RisingStack/trace-nodejs/commit/30925b0))



<a name="2.1.3"></a>
## [2.1.3](https://github.com/RisingStack/trace-nodejs/compare/v2.1.2...v2.1.3) (2016-02-10)


### Bug Fixes

* **httpTransaction:** on http error type is \err\ ([52451f0](https://github.com/RisingStack/trace-nodejs/commit/52451f0))



<a name="2.1.2"></a>
## [2.1.2](https://github.com/RisingStack/trace-nodejs/compare/v2.1.1...v2.1.2) (2016-02-09)


### Bug Fixes

* **cls:** always check if binded arg is a function ([4f25b54](https://github.com/RisingStack/trace-nodejs/commit/4f25b54))



<a name="2.1.1"></a>
## [2.1.1](https://github.com/RisingStack/trace-nodejs/compare/v2.1.0...v2.1.1) (2016-02-07)


### Bug Fixes

* **npmignore:** adding *.spec.e2e.js ([d295d2a](https://github.com/RisingStack/trace-nodejs/commit/d295d2a))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/RisingStack/trace-nodejs/compare/v2.0.1...v2.1.0) (2016-02-07)


### Features

* **error-report:** add trace.errorReport ([d0f4c3d](https://github.com/RisingStack/trace-nodejs/commit/d0f4c3d))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/RisingStack/trace-nodejs/compare/v2.0.0...v2.0.1) (2016-02-03)


### Bug Fixes

* **http:** remove process.nextTick ([b75bd62](https://github.com/RisingStack/trace-nodejs/commit/b75bd62))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/RisingStack/trace-nodejs/compare/v1.13.2...v2.0.0) (2016-02-02)


### Bug Fixes

* **api:** expose 401 errors ([5a1e650](https://github.com/RisingStack/trace-nodejs/commit/5a1e650))
* **cls:** add debug namespace ([6f7d91d](https://github.com/RisingStack/trace-nodejs/commit/6f7d91d))
* **cls:** hook module loading ([9999263](https://github.com/RisingStack/trace-nodejs/commit/9999263))
* **cls:** use the fork of cls till the PR is merged ([b851663](https://github.com/RisingStack/trace-nodejs/commit/b851663))
* **cls:** wrap more mongo related functions ([61a30ec](https://github.com/RisingStack/trace-nodejs/commit/61a30ec))
* **cls:** wrapping mongoose ([2230075](https://github.com/RisingStack/trace-nodejs/commit/2230075))
* **collector:** read config from single source ([c9493f5](https://github.com/RisingStack/trace-nodejs/commit/c9493f5))
* **config:** remove localhost ([7a14905](https://github.com/RisingStack/trace-nodejs/commit/7a14905))
* **configReader:** fix fn name ([983ed15](https://github.com/RisingStack/trace-nodejs/commit/983ed15))
* **env:** extending the default env, not overwriting ([b0fd036](https://github.com/RisingStack/trace-nodejs/commit/b0fd036))
* **http:** log the requestId on mustCollect ([aec7e04](https://github.com/RisingStack/trace-nodejs/commit/aec7e04))
* **httpTransaction:** fix span creation ([c8e3b16](https://github.com/RisingStack/trace-nodejs/commit/c8e3b16))
* **lib:** in case of missing parameters errors should be logged, but not crash the process ([bb2efbd](https://github.com/RisingStack/trace-nodejs/commit/bb2efbd))
* **mongoose:** adding cls patch for mongoose ([5361cf2](https://github.com/RisingStack/trace-nodejs/commit/5361cf2))
* **report:** add parameter validation ([5e3362a](https://github.com/RisingStack/trace-nodejs/commit/5e3362a))
* **us:** reported names have to be unique ([2f7a41f](https://github.com/RisingStack/trace-nodejs/commit/2f7a41f))
* **whitelist:** add collectorApi ([9aa49de](https://github.com/RisingStack/trace-nodejs/commit/9aa49de))

### Features

* **cls:** add mysql support ([85faaf1](https://github.com/RisingStack/trace-nodejs/commit/85faaf1))
* **cls:** add q ([dbe0bfc](https://github.com/RisingStack/trace-nodejs/commit/dbe0bfc))
* **cls:** adding amqp ([fe127d7](https://github.com/RisingStack/trace-nodejs/commit/fe127d7))
* **cls:** adding bluebird support ([ff4f5b0](https://github.com/RisingStack/trace-nodejs/commit/ff4f5b0))
* **cls:** adding support for redis ([1a40599](https://github.com/RisingStack/trace-nodejs/commit/1a40599))
* **cs:** generate trace-id if there is none ([2f5710b](https://github.com/RisingStack/trace-nodejs/commit/2f5710b))
* **userSend:** change user sent api ([de5693e](https://github.com/RisingStack/trace-nodejs/commit/de5693e))



<a name="1.13.2"></a>
## [1.13.2](https://github.com/RisingStack/trace-nodejs/compare/v1.13.1...v1.13.2) (2016-01-19)


### Bug Fixes

* **isForceSample:** set it for stack traces ([e91b9cc](https://github.com/RisingStack/trace-nodejs/commit/e91b9cc))
* **mustCollect:** fix must collect ([350329e](https://github.com/RisingStack/trace-nodejs/commit/350329e))
* **sampling:** unify samping method ([f4d048a](https://github.com/RisingStack/trace-nodejs/commit/f4d048a))
* **spanId:** add spanId to user-sent and error events ([c8d91a1](https://github.com/RisingStack/trace-nodejs/commit/c8d91a1))



<a name="1.13.1"></a>
## [1.13.1](https://github.com/RisingStack/trace-nodejs/compare/v1.13.0...v1.13.1) (2016-01-13)


### Bug Fixes

* **mustCollect:** use a store instead of the session store ([f77ed8e](https://github.com/RisingStack/trace-nodejs/commit/f77ed8e))



<a name="1.13.0"></a>
# [1.13.0](https://github.com/RisingStack/trace-nodejs/compare/v1.12.2...v1.13.0) (2016-01-13)


### Bug Fixes

* **error:** send stack trace in the raw object ([80fed8b](https://github.com/RisingStack/trace-nodejs/commit/80fed8b))
* **error:** sending error properties explicitly ([80da48e](https://github.com/RisingStack/trace-nodejs/commit/80da48e))
* **error:** use more descriptive names for errors ([32f4a53](https://github.com/RisingStack/trace-nodejs/commit/32f4a53))
* **httpTransaction:** fix user sent event ([246ffd0](https://github.com/RisingStack/trace-nodejs/commit/246ffd0))
* **mustCollect:** adding mustCollect to request collector ([5df60c5](https://github.com/RisingStack/trace-nodejs/commit/5df60c5))
* **mustCollect:** mustCollect header to request finish ([ca880e1](https://github.com/RisingStack/trace-nodejs/commit/ca880e1))

### Features

* **mustCollect:** add header to outgoing requests ([49a17fb](https://github.com/RisingStack/trace-nodejs/commit/49a17fb))
* **mustCollect:** move mustCollect to cls session ([e6ceda2](https://github.com/RisingStack/trace-nodejs/commit/e6ceda2))
* **stackTrace:** add network error ([8a284ff](https://github.com/RisingStack/trace-nodejs/commit/8a284ff))
* **stackTrace:** add new error report format ([0e3e553](https://github.com/RisingStack/trace-nodejs/commit/0e3e553))



<a name="1.12.2"></a>
## [1.12.2](https://github.com/RisingStack/trace-nodejs/compare/v1.12.1...v1.12.2) (2015-11-23)


### Bug Fixes

* **wrap:** change stream wrap to http.Server ([923e50d](https://github.com/RisingStack/trace-nodejs/commit/923e50d))



<a name="1.12.1"></a>
## [1.12.1](https://github.com/RisingStack/trace-nodejs/compare/v1.12.0...v1.12.1) (2015-11-18)


### Bug Fixes

* **samplerate:** initial sample rate can be overwritten from env ([d32a3f5](https://github.com/RisingStack/trace-nodejs/commit/d32a3f5))



<a name="1.12.0"></a>
# [1.12.0](https://github.com/RisingStack/trace-nodejs/compare/v1.11.3...v1.12.0) (2015-11-18)


### Bug Fixes

* **RPM:** add tests for average response time ([34d58e8](https://github.com/RisingStack/trace-nodejs/commit/34d58e8))
* **RPM:** correct average RPM calculation ([24d2d1e](https://github.com/RisingStack/trace-nodejs/commit/24d2d1e))
* **RPM:** fix calculation issue with response time ([76c123a](https://github.com/RisingStack/trace-nodejs/commit/76c123a))
* **sampling:** use a pessimistic starting rate ([67bff9e](https://github.com/RisingStack/trace-nodejs/commit/67bff9e))
* **type:** errror -> error ([a0985f2](https://github.com/RisingStack/trace-nodejs/commit/a0985f2))

### Features

* **RPM:** add average server response time ([ce3e36c](https://github.com/RisingStack/trace-nodejs/commit/ce3e36c))
* **RPM:** add rounding to average response time send ([49fff85](https://github.com/RisingStack/trace-nodejs/commit/49fff85))



<a name="1.11.3"></a>
## [1.11.3](https://github.com/RisingStack/trace-nodejs/compare/v1.11.2...v1.11.3) (2015-11-09)


### Features

* **apm:** collect interval can be modified via env var ([70c5cbb](https://github.com/RisingStack/trace-nodejs/commit/70c5cbb))



<a name="1.11.2"></a>
## [1.11.2](https://github.com/RisingStack/trace-nodejs/compare/v1.11.1...v1.11.2) (2015-11-07)


### Bug Fixes

* **http:** set isForceSampled based on mustCollect ([fdfb222](https://github.com/RisingStack/trace-nodejs/commit/fdfb222))



<a name="1.11.1"></a>
## [1.11.1](https://github.com/RisingStack/trace-nodejs/compare/v1.11.0...v1.11.1) (2015-11-02)




<a name="1.11.0"></a>
# [1.11.0](https://github.com/RisingStack/trace-nodejs/compare/v1.10.2...v1.11.0) (2015-10-25)


### Bug Fixes

* **pathname:** replace pathname with path ([8c64375](https://github.com/RisingStack/trace-nodejs/commit/8c64375))
* **sampleRate:** fix sample rate calculation ([f4add9d](https://github.com/RisingStack/trace-nodejs/commit/f4add9d))
* **spanId:** fix spanId collecting ([abb8daf](https://github.com/RisingStack/trace-nodejs/commit/abb8daf))

### Features

* **clientSend:** add host and url to client send ([316859e](https://github.com/RisingStack/trace-nodejs/commit/316859e))



<a name="1.10.2"></a>
## [1.10.2](https://github.com/RisingStack/trace-nodejs/compare/v1.10.1...v1.10.2) (2015-10-20)


### Bug Fixes

* **apm:** cpu usage calculation ([0f36fee](https://github.com/RisingStack/trace-nodejs/commit/0f36fee))



<a name="1.10.1"></a>
## [1.10.1](https://github.com/RisingStack/trace-nodejs/compare/v1.10.0...v1.10.1) (2015-10-10)


### Bug Fixes

* **header:** fix header name case ([995cf93](https://github.com/RisingStack/trace-nodejs/commit/995cf93))
* **mustCollect:** place mustCollect setting to the right place ([b043dff](https://github.com/RisingStack/trace-nodejs/commit/b043dff))

### Features

* **logging:** add debug logging to http.prototype wraps ([a4da5ea](https://github.com/RisingStack/trace-nodejs/commit/a4da5ea))
* **mustCollect:** add must-collect header ([53ebd06](https://github.com/RisingStack/trace-nodejs/commit/53ebd06))



<a name="1.10.0"></a>
# [1.10.0](https://github.com/RisingStack/trace-nodejs/compare/v1.9.2...v1.10.0) (2015-10-07)


### Bug Fixes

* **rename:** rename responses to rpm ([69abef6](https://github.com/RisingStack/trace-nodejs/commit/69abef6))
* **tests:** add tests ([8adfb48](https://github.com/RisingStack/trace-nodejs/commit/8adfb48))
* **typo:** correct statusCode typo ([a593b3e](https://github.com/RisingStack/trace-nodejs/commit/a593b3e))

### Features

* **rpm:** add rpm functionality ([4b282e0](https://github.com/RisingStack/trace-nodejs/commit/4b282e0))



<a name="1.9.2"></a>
## [1.9.2](https://github.com/RisingStack/trace-nodejs/compare/v1.9.1...v1.9.2) (2015-10-02)


### Bug Fixes

* **trace:** check is serviceId is undefined ([2f10f5b](https://github.com/RisingStack/trace-nodejs/commit/2f10f5b))



<a name="1.9.1"></a>
## [1.9.1](https://github.com/RisingStack/trace-nodejs/compare/v1.9.0...v1.9.1) (2015-09-30)


### Bug Fixes

* **trace:** send metrics only if serviceId is present ([e8924f7](https://github.com/RisingStack/trace-nodejs/commit/e8924f7))



<a name="1.9.0"></a>
# [1.9.0](https://github.com/RisingStack/trace-nodejs/compare/v1.8.0...v1.9.0) (2015-09-27)


### Bug Fixes

* **apm:** collect every 1 minute ([b993b35](https://github.com/RisingStack/trace-nodejs/commit/b993b35))
* **apm:** only send used memory ([018484f](https://github.com/RisingStack/trace-nodejs/commit/018484f))
* **apm:** round cpu usage ([a63a813](https://github.com/RisingStack/trace-nodejs/commit/a63a813))
* **apm:** use megabytes instead of bytes ([b82ee8c](https://github.com/RisingStack/trace-nodejs/commit/b82ee8c))
* **e2e:** remove e2e test from default test command ([b086dbf](https://github.com/RisingStack/trace-nodejs/commit/b086dbf))

### Features

* **apm:** adding apm skeleton ([b4f778f](https://github.com/RisingStack/trace-nodejs/commit/b4f778f))



<a name="1.8.0"></a>
# [1.8.0](https://github.com/RisingStack/trace-nodejs/compare/v1.7.5...v1.8.0) (2015-09-21)


### Features

* **config:** remove appName duplication ([c3e7d65](https://github.com/RisingStack/trace-nodejs/commit/c3e7d65))
* **method:** add method support ([481ecd3](https://github.com/RisingStack/trace-nodejs/commit/481ecd3))



<a name="1.7.5"></a>
## [1.7.5](https://github.com/RisingStack/trace-nodejs/compare/v1.7.4...v1.7.5) (2015-09-14)


### Bug Fixes

* **cloneDeep:** fix case issue with lodash ([ebd2c1f](https://github.com/RisingStack/trace-nodejs/commit/ebd2c1f))
* **collector:** add stack trace to traces ([aff6e82](https://github.com/RisingStack/trace-nodejs/commit/aff6e82))
* **collector:** collect all traces with errors ([0f7682c](https://github.com/RisingStack/trace-nodejs/commit/0f7682c))
* **collector:** set explicit content-length ([5260fc6](https://github.com/RisingStack/trace-nodejs/commit/5260fc6))
* **collector:** set explicit content-length for samples ([78115c7](https://github.com/RisingStack/trace-nodejs/commit/78115c7))
* **empty-traces:** fix collector to not send empty trace collection ([8bdb43b](https://github.com/RisingStack/trace-nodejs/commit/8bdb43b))
* **microtime:** adding node-gyp-install ([e7247a7](https://github.com/RisingStack/trace-nodejs/commit/e7247a7))
* **reporter:** adding sync data sending ([3507692](https://github.com/RisingStack/trace-nodejs/commit/3507692))
* **reporter:** collector buffer parsing ([1092af4](https://github.com/RisingStack/trace-nodejs/commit/1092af4))
* **reporter:** logging for sync data sending ([ade9290](https://github.com/RisingStack/trace-nodejs/commit/ade9290))
* **travis:** adding node-gyp-install to travis ([2244167](https://github.com/RisingStack/trace-nodejs/commit/2244167))
* **wrap:** remove unused wraps ([87ab606](https://github.com/RisingStack/trace-nodejs/commit/87ab606))

### Features

* **file:** remove file operations in trace logging ([7250807](https://github.com/RisingStack/trace-nodejs/commit/7250807))



<a name="1.7.4"></a>
## [1.7.4](https://github.com/RisingStack/trace-nodejs/compare/v1.7.3...v1.7.4) (2015-09-10)


### Bug Fixes

* **collector:** trace init ([fd8a0cc](https://github.com/RisingStack/trace-nodejs/commit/fd8a0cc))
* **e2e:** add support for 0.10 ([efb0459](https://github.com/RisingStack/trace-nodejs/commit/efb0459))
* **stacktrace:** fatalException wrap ([50150f8](https://github.com/RisingStack/trace-nodejs/commit/50150f8))
* **travis:** node v4, not iojs v4 ([f1262b9](https://github.com/RisingStack/trace-nodejs/commit/f1262b9))

### Features

* **e2e:** add e2e tests to collector ([aa763d2](https://github.com/RisingStack/trace-nodejs/commit/aa763d2))



<a name="1.7.3"></a>
## [1.7.3](https://github.com/RisingStack/trace-nodejs/compare/v1.7.2...v1.7.3) (2015-09-04)


### Bug Fixes

* **logs:** adding more debug statements ([0ae1f47](https://github.com/RisingStack/trace-nodejs/commit/0ae1f47))
* **logs:** debug statement for JSON parsing ([317dafb](https://github.com/RisingStack/trace-nodejs/commit/317dafb))
* **reporter:** retry every time if an error happens ([48b685e](https://github.com/RisingStack/trace-nodejs/commit/48b685e))



<a name="1.7.2"></a>
## [1.7.2](https://github.com/RisingStack/trace-nodejs/compare/v1.7.1...v1.7.2) (2015-09-04)


### Bug Fixes

* **shim:** no need to wrap https ([5b8c753](https://github.com/RisingStack/trace-nodejs/commit/5b8c753))



<a name="1.7.1"></a>
## [1.7.1](https://github.com/RisingStack/trace-nodejs/compare/1.6.2...v1.7.1) (2015-09-03)


### Bug Fixes

* **reporter:** enforce https for collector communication ([c132c58](https://github.com/RisingStack/trace-nodejs/commit/c132c58))

### Features

* **statusCode:** add status code logging ([f720f64](https://github.com/RisingStack/trace-nodejs/commit/f720f64))



<a name="1.6.2"></a>
## [1.6.2](https://github.com/RisingStack/trace-nodejs/compare/v1.6.1...1.6.2) (2015-09-01)


### Bug Fixes

* **url:** use url resolve instead of plain concat ([9a3f2ea](https://github.com/RisingStack/trace-nodejs/commit/9a3f2ea))

### Features

* **logging:** add data logging to reporters ([cefc26d](https://github.com/RisingStack/trace-nodejs/commit/cefc26d))



<a name="1.6.1"></a>
## [1.6.1](https://github.com/RisingStack/trace-nodejs/compare/v1.6.0...v1.6.1) (2015-08-27)


### Bug Fixes

* **typos:** debug module ([4240d16](https://github.com/RisingStack/trace-nodejs/commit/4240d16))



<a name="1.6.0"></a>
# [1.6.0](https://github.com/RisingStack/trace-nodejs/compare/v1.5.1...v1.6.0) (2015-08-26)


### Features

* **debug:** adding debug statements to important parts ([fda7112](https://github.com/RisingStack/trace-nodejs/commit/fda7112))



<a name="1.5.1"></a>
## [1.5.1](https://github.com/RisingStack/trace-nodejs/compare/v1.5.0...v1.5.1) (2015-08-19)


### Bug Fixes

* **span-id:** generate new span-id on every outgoing request ([b6cd91a](https://github.com/RisingStack/trace-nodejs/commit/b6cd91a))



<a name="1.5.0"></a>
# [1.5.0](https://github.com/RisingStack/trace-nodejs/compare/v1.4.0...v1.5.0) (2015-08-12)


### Bug Fixes

* **jshint:** add jshint to examples ([403b57b](https://github.com/RisingStack/trace-nodejs/commit/403b57b))

### Features

* **version:** add package version as a header ([df2d42e](https://github.com/RisingStack/trace-nodejs/commit/df2d42e))
* **version:** add package version to getService ([a3068a6](https://github.com/RisingStack/trace-nodejs/commit/a3068a6))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/RisingStack/trace-nodejs/compare/v1.3.0...v1.4.0) (2015-08-07)


### Bug Fixes

* **reporter:** fix reporter http chunk reading ([a0c68f7](https://github.com/RisingStack/trace-nodejs/commit/a0c68f7))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/RisingStack/trace-nodejs/compare/v1.2.0...v1.3.0) (2015-08-06)


### Bug Fixes

* **package.json:** bumping to 1.3.0 ([22ec858](https://github.com/RisingStack/trace-nodejs/commit/22ec858))
* **travis:** adding iojs v2 and v3 ([225dbee](https://github.com/RisingStack/trace-nodejs/commit/225dbee))

### Features

* **http.Server:** adding wildcard support for ignoreHeaders ([4ae89ff](https://github.com/RisingStack/trace-nodejs/commit/4ae89ff))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/RisingStack/trace-nodejs/compare/v1.1.7...v1.2.0) (2015-08-06)


### Bug Fixes

* **config:** make it simpler ([5dc3017](https://github.com/RisingStack/trace-nodejs/commit/5dc3017))

### Features

* **ignoreHeaders:** add ignoreHeaders to the config ([88a74e1](https://github.com/RisingStack/trace-nodejs/commit/88a74e1))



<a name="1.1.7"></a>
## [1.1.7](https://github.com/RisingStack/trace-nodejs/compare/v1.1.6...v1.1.7) (2015-08-05)


### Bug Fixes

* **config:** send sample every 120 secs ([f7d1e22](https://github.com/RisingStack/trace-nodejs/commit/f7d1e22))
* **package.json:** bumping to 1.1.7 ([58d1bf2](https://github.com/RisingStack/trace-nodejs/commit/58d1bf2))



<a name="1.1.6"></a>
## [1.1.6](https://github.com/RisingStack/trace-nodejs/compare/v1.1.5...v1.1.6) (2015-08-04)


### Bug Fixes

* **config:** update collector endpoint ([2466c5c](https://github.com/RisingStack/trace-nodejs/commit/2466c5c))
* **shimmer:** change namespace to RS ([bbc7145](https://github.com/RisingStack/trace-nodejs/commit/bbc7145))



<a name="1.1.5"></a>
## [1.1.5](https://github.com/RisingStack/trace-nodejs/compare/v1.1.4...v1.1.5) (2015-08-02)


### Bug Fixes

* **collector:** unhandled unlink error event ([c4c7e09](https://github.com/RisingStack/trace-nodejs/commit/c4c7e09))



<a name="1.1.4"></a>
## [1.1.4](https://github.com/RisingStack/trace-nodejs/compare/v1.1.3...v1.1.4) (2015-07-31)


### Bug Fixes

* **trace-reporter:** fixing retry on status code 409 ([adfbb2b](https://github.com/RisingStack/trace-nodejs/commit/adfbb2b))



<a name="1.1.3"></a>
## [1.1.3](https://github.com/RisingStack/trace-nodejs/compare/v1.1.2...v1.1.3) (2015-07-29)


### Features

* **stream:** bind stream ([9d18174](https://github.com/RisingStack/trace-nodejs/commit/9d18174))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/RisingStack/trace-nodejs/compare/v1.1.1...v1.1.2) (2015-07-27)


### Features

* **trace-reporter:** use JSON to send data to Trace ([07a6fdd](https://github.com/RisingStack/trace-nodejs/commit/07a6fdd))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/RisingStack/trace-nodejs/compare/v1.1.0...v1.1.1) (2015-07-26)




<a name="1.1.0"></a>
# [1.1.0](https://github.com/RisingStack/trace-nodejs/compare/1.1.0...v1.1.0) (2015-07-25)


### Bug Fixes

* **core-emitters:** refactor CLS binding ([03723cc](https://github.com/RisingStack/trace-nodejs/commit/03723cc))
* **logstash-reporter:** send data w/ `@timestamp` ([cd17f52](https://github.com/RisingStack/trace-nodejs/commit/cd17f52))
* **wrap:** add http.get(urlString) wrapping ([993fb70](https://github.com/RisingStack/trace-nodejs/commit/993fb70))
* **wrap-test:** create namespace for wrapping tests ([3eef52d](https://github.com/RisingStack/trace-nodejs/commit/3eef52d))

### Features

* **example:** add working example ([af292ac](https://github.com/RisingStack/trace-nodejs/commit/af292ac))
* **reporter:** add logstash reporter ([4037096](https://github.com/RisingStack/trace-nodejs/commit/4037096))
* **reporter:** adding reporters ([c2c52b5](https://github.com/RisingStack/trace-nodejs/commit/c2c52b5))
* **stacktrace:** collect data from errors ([a1f564f](https://github.com/RisingStack/trace-nodejs/commit/a1f564f))
* **stacktrace:** collect data from errors ([95c14d6](https://github.com/RisingStack/trace-nodejs/commit/95c14d6))



<a name="1.1.0"></a>
# 1.1.0 (2015-04-17)
