

### Features

* **method:** add method support ([481ecd3](https://github.com/RisingStack/trace-nodejs/commit/481ecd3))



<a name="1.7.5"></a>
## [1.7.5](https://github.com/RisingStack/trace-nodejs/compare/v1.7.5...v1.7.5) (2015-09-14)




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




