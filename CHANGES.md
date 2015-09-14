<a name="1.7.5"></a>
## 1.7.5 (2015-09-14)


### chore

* chore(package): update supported node versions ([aa99633](https://github.com/RisingStack/trace-nodejs/commit/aa99633))



<a name="1.7.5"></a>
## 1.7.5 (2015-09-14)


* fix(sampleRate) ([6179602](https://github.com/RisingStack/trace-nodejs/commit/6179602))

### chore

* chore(ci): use codeship instead of travis ([cd4e533](https://github.com/RisingStack/trace-nodejs/commit/cd4e533))
* chore(debug-log): add npm debug log to gitignore ([98872c3](https://github.com/RisingStack/trace-nodejs/commit/98872c3))
* chore(package): bumping version to 1.7.5 ([9434f70](https://github.com/RisingStack/trace-nodejs/commit/9434f70))

### feat

* feat(file): remove file operations in trace logging ([7250807](https://github.com/RisingStack/trace-nodejs/commit/7250807))

### fix

* fix(cloneDeep): fix case issue with lodash ([ebd2c1f](https://github.com/RisingStack/trace-nodejs/commit/ebd2c1f))
* fix(collector): add stack trace to traces ([aff6e82](https://github.com/RisingStack/trace-nodejs/commit/aff6e82))
* fix(collector): collect all traces with errors ([0f7682c](https://github.com/RisingStack/trace-nodejs/commit/0f7682c))
* fix(collector): set explicit content-length ([5260fc6](https://github.com/RisingStack/trace-nodejs/commit/5260fc6))
* fix(collector): set explicit content-length for samples ([78115c7](https://github.com/RisingStack/trace-nodejs/commit/78115c7))
* fix(empty-traces): fix collector to not send empty trace collection ([8bdb43b](https://github.com/RisingStack/trace-nodejs/commit/8bdb43b))
* fix(microtime): adding node-gyp-install ([e7247a7](https://github.com/RisingStack/trace-nodejs/commit/e7247a7))
* fix(reporter): adding sync data sending ([3507692](https://github.com/RisingStack/trace-nodejs/commit/3507692))
* fix(reporter): collector buffer parsing ([1092af4](https://github.com/RisingStack/trace-nodejs/commit/1092af4))
* fix(reporter): logging for sync data sending ([ade9290](https://github.com/RisingStack/trace-nodejs/commit/ade9290))
* fix(travis): adding node-gyp-install to travis ([2244167](https://github.com/RisingStack/trace-nodejs/commit/2244167))
* fix(wrap): remove unused wraps ([87ab606](https://github.com/RisingStack/trace-nodejs/commit/87ab606))



<a name="1.7.4"></a>
## 1.7.4 (2015-09-10)


* fix(retry) ([9606c38](https://github.com/RisingStack/trace-nodejs/commit/9606c38))

### chore

* chore(package): bumping version to 1.7.4 ([d9270ff](https://github.com/RisingStack/trace-nodejs/commit/d9270ff))
* chore(package): npm test runs all the tests ([e04e534](https://github.com/RisingStack/trace-nodejs/commit/e04e534))
* chore(package): update microtime to support iojs3+ ([8b9f954](https://github.com/RisingStack/trace-nodejs/commit/8b9f954))
* chore(readme): remove production warning ([d27100e](https://github.com/RisingStack/trace-nodejs/commit/d27100e))
* chore(travis): update iojs version ([00480a8](https://github.com/RisingStack/trace-nodejs/commit/00480a8))

### feat

* feat(e2e): add e2e tests to collector ([aa763d2](https://github.com/RisingStack/trace-nodejs/commit/aa763d2))

### fix

* fix(collector): trace init ([fd8a0cc](https://github.com/RisingStack/trace-nodejs/commit/fd8a0cc))
* fix(e2e): add support for 0.10 ([efb0459](https://github.com/RisingStack/trace-nodejs/commit/efb0459))
* fix(stacktrace): fatalException wrap ([50150f8](https://github.com/RisingStack/trace-nodejs/commit/50150f8))
* fix(travis): node v4, not iojs v4 ([f1262b9](https://github.com/RisingStack/trace-nodejs/commit/f1262b9))

### refactor

* refactor(http): introduce bl to http communication ([db5f56b](https://github.com/RisingStack/trace-nodejs/commit/db5f56b))



<a name="1.7.3"></a>
## 1.7.3 (2015-09-04)


### chore

* chore(npmignore): adding spec files ([7ec2256](https://github.com/RisingStack/trace-nodejs/commit/7ec2256))
* chore(package): bumping version to 1.7.3 ([1b748ac](https://github.com/RisingStack/trace-nodejs/commit/1b748ac))

### fix

* fix(logs): adding more debug statements ([0ae1f47](https://github.com/RisingStack/trace-nodejs/commit/0ae1f47))
* fix(logs): debug statement for JSON parsing ([317dafb](https://github.com/RisingStack/trace-nodejs/commit/317dafb))
* fix(reporter): retry every time if an error happens ([48b685e](https://github.com/RisingStack/trace-nodejs/commit/48b685e))



<a name="1.7.2"></a>
## 1.7.2 (2015-09-04)


### chore

* chore(package): bumping version to 1.7.2 ([61b9362](https://github.com/RisingStack/trace-nodejs/commit/61b9362))

### fix

* fix(shim): no need to wrap https ([5b8c753](https://github.com/RisingStack/trace-nodejs/commit/5b8c753))



<a name="1.7.1"></a>
## 1.7.1 (2015-09-03)


### chore

* chore(package): bump package version ([93b4f21](https://github.com/RisingStack/trace-nodejs/commit/93b4f21))
* chore(package): bumping version to 1.7.1 ([88f427a](https://github.com/RisingStack/trace-nodejs/commit/88f427a))

### feat

* feat(statusCode): add status code logging ([f720f64](https://github.com/RisingStack/trace-nodejs/commit/f720f64))

### fix

* fix(reporter): enforce https for collector communication ([c132c58](https://github.com/RisingStack/trace-nodejs/commit/c132c58))

### refactor

* refactor(whiteListHosts): move to config file ([28f7d98](https://github.com/RisingStack/trace-nodejs/commit/28f7d98))



<a name="1.6.2"></a>
## 1.6.2 (2015-09-01)


### chore

* chore(version): bump patch version ([2843a48](https://github.com/RisingStack/trace-nodejs/commit/2843a48))

### feat

* feat(logging): add data logging to reporters ([cefc26d](https://github.com/RisingStack/trace-nodejs/commit/cefc26d))

### fix

* fix(url): use url resolve instead of plain concat ([9a3f2ea](https://github.com/RisingStack/trace-nodejs/commit/9a3f2ea))



<a name="1.6.1"></a>
## 1.6.1 (2015-08-27)


### chore

* chore(package): bumping version to 1.6.1 ([c38c888](https://github.com/RisingStack/trace-nodejs/commit/c38c888))

### fix

* fix(typos): debug module ([4240d16](https://github.com/RisingStack/trace-nodejs/commit/4240d16))



<a name="1.6.0"></a>
# 1.6.0 (2015-08-26)


### chore

* chore(package): bumping version to 1.6.0 ([8d2935a](https://github.com/RisingStack/trace-nodejs/commit/8d2935a))
* chore(readme): fix readme language ([cee81b6](https://github.com/RisingStack/trace-nodejs/commit/cee81b6))
* chore(readme): point out npm version for scoped packages ([e3a032f](https://github.com/RisingStack/trace-nodejs/commit/e3a032f))

### feat

* feat(debug): adding debug statements to important parts ([fda7112](https://github.com/RisingStack/trace-nodejs/commit/fda7112))



<a name="1.5.1"></a>
## 1.5.1 (2015-08-19)


### chore

* chore(package): bumping version to 1.5.1 ([1e4fbb0](https://github.com/RisingStack/trace-nodejs/commit/1e4fbb0))
* chore(readme): stress out ignoreHeaders ([45921fa](https://github.com/RisingStack/trace-nodejs/commit/45921fa))

### fix

* fix(span-id): generate new span-id on every outgoing request ([b6cd91a](https://github.com/RisingStack/trace-nodejs/commit/b6cd91a))



<a name="1.5.0"></a>
# 1.5.0 (2015-08-12)


### chore

* chore(version): bumped version to 1.5.0 ([e444cce](https://github.com/RisingStack/trace-nodejs/commit/e444cce))

### feat

* feat(version): add package version as a header ([df2d42e](https://github.com/RisingStack/trace-nodejs/commit/df2d42e))
* feat(version): add package version to getService ([a3068a6](https://github.com/RisingStack/trace-nodejs/commit/a3068a6))

### fix

* fix(jshint): add jshint to examples ([403b57b](https://github.com/RisingStack/trace-nodejs/commit/403b57b))



<a name="1.4.0"></a>
# 1.4.0 (2015-08-07)


### chore

* chore(package): bump version to 1.4.0 ([6a1bf46](https://github.com/RisingStack/trace-nodejs/commit/6a1bf46))

### fix

* fix(reporter): fix reporter http chunk reading ([a0c68f7](https://github.com/RisingStack/trace-nodejs/commit/a0c68f7))



<a name="1.3.0"></a>
# 1.3.0 (2015-08-06)


### feat

* feat(http.Server): adding wildcard support for ignoreHeaders ([4ae89ff](https://github.com/RisingStack/trace-nodejs/commit/4ae89ff))

### fix

* fix(package.json): bumping to 1.3.0 ([22ec858](https://github.com/RisingStack/trace-nodejs/commit/22ec858))
* fix(travis): adding iojs v2 and v3 ([225dbee](https://github.com/RisingStack/trace-nodejs/commit/225dbee))



<a name="1.2.0"></a>
# 1.2.0 (2015-08-06)


### chore

* chore(package): bump version to 1.2.0 ([c8353b4](https://github.com/RisingStack/trace-nodejs/commit/c8353b4))

### feat

* feat(ignoreHeaders): add ignoreHeaders to the config ([88a74e1](https://github.com/RisingStack/trace-nodejs/commit/88a74e1))

### fix

* fix(config): make it simpler ([5dc3017](https://github.com/RisingStack/trace-nodejs/commit/5dc3017))



<a name="1.1.7"></a>
## 1.1.7 (2015-08-05)


### fix

* fix(config): send sample every 120 secs ([f7d1e22](https://github.com/RisingStack/trace-nodejs/commit/f7d1e22))
* fix(package.json): bumping to 1.1.7 ([58d1bf2](https://github.com/RisingStack/trace-nodejs/commit/58d1bf2))



<a name="1.1.6"></a>
## 1.1.6 (2015-08-04)


### chore

* chore(package): bump version to 1.1.6 ([e7785b3](https://github.com/RisingStack/trace-nodejs/commit/e7785b3))

### fix

* fix(config): update collector endpoint ([2466c5c](https://github.com/RisingStack/trace-nodejs/commit/2466c5c))
* fix(shimmer): change namespace to RS ([bbc7145](https://github.com/RisingStack/trace-nodejs/commit/bbc7145))



<a name="1.1.5"></a>
## 1.1.5 (2015-08-02)


### chore

* chore(package): bump version to 1.1.5 ([0a7494f](https://github.com/RisingStack/trace-nodejs/commit/0a7494f))

### fix

* fix(collector): unhandled unlink error event ([c4c7e09](https://github.com/RisingStack/trace-nodejs/commit/c4c7e09))



<a name="1.1.4"></a>
## 1.1.4 (2015-07-31)


* Updating package.json and changelog ([9e0de09](https://github.com/RisingStack/trace-nodejs/commit/9e0de09))

### fix

* fix(trace-reporter): fixing retry on status code 409 ([adfbb2b](https://github.com/RisingStack/trace-nodejs/commit/adfbb2b))



<a name="1.1.3"></a>
## 1.1.3 (2015-07-29)


### chore

* chore(package): bump version to 1.1.3 ([33a9c67](https://github.com/RisingStack/trace-nodejs/commit/33a9c67))

### feat

* feat(stream): bind stream ([9d18174](https://github.com/RisingStack/trace-nodejs/commit/9d18174))



<a name="1.1.2"></a>
## 1.1.2 (2015-07-27)


### feat

* feat(trace-reporter): use JSON to send data to Trace ([07a6fdd](https://github.com/RisingStack/trace-nodejs/commit/07a6fdd))

* Bumping version to 1.1.1 ([f1460a7](https://github.com/RisingStack/trace-nodejs/commit/f1460a7))
* Merge pull request #28 from RisingStack/feature/trace-reporter ([8924e36](https://github.com/RisingStack/trace-nodejs/commit/8924e36))
* Update package.json ([d11581f](https://github.com/RisingStack/trace-nodejs/commit/d11581f))



<a name="1.1.1"></a>
## 1.1.1 (2015-07-26)


* Adding idea to npmignore ([4da8f0b](https://github.com/RisingStack/trace-nodejs/commit/4da8f0b))



<a name="1.1.0"></a>
# 1.1.0 (2015-07-25)


### docs

* docs(config): update readme ([5b0bc48](https://github.com/RisingStack/trace-nodejs/commit/5b0bc48))
* docs(node-versions): update readme w/ node/iojs version compatibility ([0e22766](https://github.com/RisingStack/trace-nodejs/commit/0e22766))
* docs(readme): update readme with reporters ([bba030b](https://github.com/RisingStack/trace-nodejs/commit/bba030b))
* docs(release): prepare for opensource release ([7d7ab0e](https://github.com/RisingStack/trace-nodejs/commit/7d7ab0e))

### feat

* feat(example): add working example ([af292ac](https://github.com/RisingStack/trace-nodejs/commit/af292ac))
* feat(reporter): add logstash reporter ([4037096](https://github.com/RisingStack/trace-nodejs/commit/4037096))
* feat(reporter): adding reporters ([c2c52b5](https://github.com/RisingStack/trace-nodejs/commit/c2c52b5))
* feat(stacktrace): collect data from errors ([a1f564f](https://github.com/RisingStack/trace-nodejs/commit/a1f564f))
* feat(stacktrace): collect data from errors ([95c14d6](https://github.com/RisingStack/trace-nodejs/commit/95c14d6))

### feature

* feature(config): enable to override reporter config w/ ENV ([431d4aa](https://github.com/RisingStack/trace-nodejs/commit/431d4aa))

### fix

* fix(core-emitters): refactor CLS binding ([03723cc](https://github.com/RisingStack/trace-nodejs/commit/03723cc))
* fix(logstash-reporter): send data w/ `@timestamp` ([cd17f52](https://github.com/RisingStack/trace-nodejs/commit/cd17f52))
* fix(wrap-test): create namespace for wrapping tests ([3eef52d](https://github.com/RisingStack/trace-nodejs/commit/3eef52d))
* fix(wrap): add http.get(urlString) wrapping ([993fb70](https://github.com/RisingStack/trace-nodejs/commit/993fb70))

### refactor

* refactor(config): read ENV vars in config ([284450f](https://github.com/RisingStack/trace-nodejs/commit/284450f))
* refactor(naming): rename `seetru` to `trace` ([05bef09](https://github.com/RisingStack/trace-nodejs/commit/05bef09))
* refactor(wrap): use enter/exit instead of bind ([d7c560d](https://github.com/RisingStack/trace-nodejs/commit/d7c560d))

* Add config file (finally!) ([3cebe33](https://github.com/RisingStack/trace-nodejs/commit/3cebe33))
* Add config file (finally!) ([dc1c390](https://github.com/RisingStack/trace-nodejs/commit/dc1c390))
* Add logo to readme ([3dfbdfc](https://github.com/RisingStack/trace-nodejs/commit/3dfbdfc))
* Add travis ([1c59ac4](https://github.com/RisingStack/trace-nodejs/commit/1c59ac4))
* added deleting upon superagent error ([6941577](https://github.com/RisingStack/trace-nodejs/commit/6941577))
* added fatal exception handling ([86986e3](https://github.com/RisingStack/trace-nodejs/commit/86986e3))
* Adding better stack trace handling ([60b1639](https://github.com/RisingStack/trace-nodejs/commit/60b1639))
* Adding config file support ([b5e8017](https://github.com/RisingStack/trace-nodejs/commit/b5e8017))
* Adding config to readme ([36871e8](https://github.com/RisingStack/trace-nodejs/commit/36871e8))
* Adding debug module ([cc11d8e](https://github.com/RisingStack/trace-nodejs/commit/cc11d8e))
* Adding e2e test skeleton ([c5f6f9d](https://github.com/RisingStack/trace-nodejs/commit/c5f6f9d))
* Adding error handle for client recieve ([e6eb126](https://github.com/RisingStack/trace-nodejs/commit/e6eb126))
* Adding example ([4f7186a](https://github.com/RisingStack/trace-nodejs/commit/4f7186a))
* Adding getTransaction id with tests ([ee525d5](https://github.com/RisingStack/trace-nodejs/commit/ee525d5))
* Adding parallel spawing of processes ([23ba701](https://github.com/RisingStack/trace-nodejs/commit/23ba701))
* Adding seetru.report a.k.a. opt-in data sending ([8f877bb](https://github.com/RisingStack/trace-nodejs/commit/8f877bb))
* Adding ServerSend time to server response ([b004390](https://github.com/RisingStack/trace-nodejs/commit/b004390))
* Adding test cases for required config properties ([bb0e4ac](https://github.com/RisingStack/trace-nodejs/commit/bb0e4ac))
* Adding test cases for required config properties ([0685a66](https://github.com/RisingStack/trace-nodejs/commit/0685a66))
* Adding test for seetru.report ([523a43d](https://github.com/RisingStack/trace-nodejs/commit/523a43d))
* Always log request where statusCode > 399 ([8c5e58a](https://github.com/RisingStack/trace-nodejs/commit/8c5e58a))
* Binding eventemitters ([27fdba9](https://github.com/RisingStack/trace-nodejs/commit/27fdba9))
* Bump version to 1.0.1 ([f534b16](https://github.com/RisingStack/trace-nodejs/commit/f534b16))
* Bumping version to 1.1.0 ([dc56b5b](https://github.com/RisingStack/trace-nodejs/commit/dc56b5b))
* Clean up event listeners in collector ([6b11cbd](https://github.com/RisingStack/trace-nodejs/commit/6b11cbd))
* Clean up wrapping ([a2f7acd](https://github.com/RisingStack/trace-nodejs/commit/a2f7acd))
* Delete unnec files ([b27501e](https://github.com/RisingStack/trace-nodejs/commit/b27501e))
* Domain update ([5e04fa3](https://github.com/RisingStack/trace-nodejs/commit/5e04fa3))
* Fix reporting ([7b5ab14](https://github.com/RisingStack/trace-nodejs/commit/7b5ab14))
* Fix request-id/session assignment ([fa1a462](https://github.com/RisingStack/trace-nodejs/commit/fa1a462))
* Fix service id passing ([73d2a2c](https://github.com/RisingStack/trace-nodejs/commit/73d2a2c))
* Fix shimmer require to lower case ([e81203d](https://github.com/RisingStack/trace-nodejs/commit/e81203d))
* Fix uninstrumented calls ([bd8560a](https://github.com/RisingStack/trace-nodejs/commit/bd8560a))
* Fixing nameSpace creation ([17c3678](https://github.com/RisingStack/trace-nodejs/commit/17c3678))
* Fixing test case for CR ([da96ffe](https://github.com/RisingStack/trace-nodejs/commit/da96ffe))
* Fixing test cases ([dd4d4fd](https://github.com/RisingStack/trace-nodejs/commit/dd4d4fd))
* Introduce new `x-client-send`, `x-span-id` and `x-parent` headers ([9a597ac](https://github.com/RisingStack/trace-nodejs/commit/9a597ac))
* Listening for stdout event instead of setTimeout ([5708244](https://github.com/RisingStack/trace-nodejs/commit/5708244))
* Listening for stdout event instead of setTimeout ([e59e993](https://github.com/RisingStack/trace-nodejs/commit/e59e993))
* Make debug statements more sane ([3f29169](https://github.com/RisingStack/trace-nodejs/commit/3f29169))
* Make risingtrace-agent a singleton ([e3b180f](https://github.com/RisingStack/trace-nodejs/commit/e3b180f))
* Match stack trace with request-id ([ac2e0cf](https://github.com/RisingStack/trace-nodejs/commit/ac2e0cf))
* Merge branch 'master' of github.com:RisingStack/trace-nodejs ([5393882](https://github.com/RisingStack/trace-nodejs/commit/5393882))
* Merge branch 'master' of github.com:RisingStack/trace-nodejs ([943b561](https://github.com/RisingStack/trace-nodejs/commit/943b561))
* Merge branch 'master' of github.com:RisingStack/trace-nodejs ([7502563](https://github.com/RisingStack/trace-nodejs/commit/7502563))
* Merge pull request #10 from RisingStack/fixes/collector ([f2a16a9](https://github.com/RisingStack/trace-nodejs/commit/f2a16a9))
* Merge pull request #12 from RisingStack/feature/reporters ([7a16367](https://github.com/RisingStack/trace-nodejs/commit/7a16367))
* Merge pull request #13 from RisingStack/feature/logstash-reporter ([3adeb44](https://github.com/RisingStack/trace-nodejs/commit/3adeb44))
* Merge pull request #14 from RisingStack/docs/readme ([edc100f](https://github.com/RisingStack/trace-nodejs/commit/edc100f))
* Merge pull request #15 from RisingStack/fix/wrap ([587ff0a](https://github.com/RisingStack/trace-nodejs/commit/587ff0a))
* Merge pull request #16 from RisingStack/docs/node-versions ([94f1387](https://github.com/RisingStack/trace-nodejs/commit/94f1387))
* Merge pull request #17 from RisingStack/refactor/trace ([233bca4](https://github.com/RisingStack/trace-nodejs/commit/233bca4))
* Merge pull request #18 from RisingStack/test/wrap ([6ad3ce1](https://github.com/RisingStack/trace-nodejs/commit/6ad3ce1))
* Merge pull request #19 from RisingStack/refactor/headers ([0dfe893](https://github.com/RisingStack/trace-nodejs/commit/0dfe893))
* Merge pull request #20 from RisingStack/feature/opensource ([676b5cd](https://github.com/RisingStack/trace-nodejs/commit/676b5cd))
* Merge pull request #21 from RisingStack/fix/core-emitters ([a17e1f3](https://github.com/RisingStack/trace-nodejs/commit/a17e1f3))
* Merge pull request #24 from RisingStack/feature/expose-transaction-id ([95f8c8d](https://github.com/RisingStack/trace-nodejs/commit/95f8c8d))
* Merge pull request #25 from RisingStack/feature/config ([7156192](https://github.com/RisingStack/trace-nodejs/commit/7156192))
* Merge pull request #26 from RisingStack/fix/logstash-reporter ([81fa6f8](https://github.com/RisingStack/trace-nodejs/commit/81fa6f8))
* Merge pull request #27 from RisingStack/feature/stacktrace ([aef6203](https://github.com/RisingStack/trace-nodejs/commit/aef6203))
* Merge pull request #7 from RisingStack/feature/host ([005db34](https://github.com/RisingStack/trace-nodejs/commit/005db34))
* Merging master ([2c13760](https://github.com/RisingStack/trace-nodejs/commit/2c13760))
* Merging master ([12e7e69](https://github.com/RisingStack/trace-nodejs/commit/12e7e69))
* Move the wrappers to a sync level ([c4f9f03](https://github.com/RisingStack/trace-nodejs/commit/c4f9f03))
* Orphan traces are now found ([9ab62e2](https://github.com/RisingStack/trace-nodejs/commit/9ab62e2))
* Orphan traces are now sent ([9f54d8b](https://github.com/RisingStack/trace-nodejs/commit/9f54d8b))
* Read error logs on startup ([be5c1a9](https://github.com/RisingStack/trace-nodejs/commit/be5c1a9))
* Refactor beginning ([a2096bf](https://github.com/RisingStack/trace-nodejs/commit/a2096bf))
* Remove deprecated test cases ([1ece3f1](https://github.com/RisingStack/trace-nodejs/commit/1ece3f1))
* Remove h1 title for README ([0fbff88](https://github.com/RisingStack/trace-nodejs/commit/0fbff88))
* Remove item from whitelistHost ([d830670](https://github.com/RisingStack/trace-nodejs/commit/d830670))
* Remove unnec example files ([452eca0](https://github.com/RisingStack/trace-nodejs/commit/452eca0))
* Remove unnec line ([4219fa2](https://github.com/RisingStack/trace-nodejs/commit/4219fa2))
* Removing unnec deps ([0c82f03](https://github.com/RisingStack/trace-nodejs/commit/0c82f03))
* Response error handlig ([8555ff6](https://github.com/RisingStack/trace-nodejs/commit/8555ff6))
* Reverting to old-style binding of session store ([7c07fea](https://github.com/RisingStack/trace-nodejs/commit/7c07fea))
* Send the hosts as well ([1a3330a](https://github.com/RisingStack/trace-nodejs/commit/1a3330a))
* Sending stack trace in object, not string ([3f5c298](https://github.com/RisingStack/trace-nodejs/commit/3f5c298))
* Separate badges from logo in README ([947e9c6](https://github.com/RisingStack/trace-nodejs/commit/947e9c6))
* Separate unit and e2e tests ([d1bfd0a](https://github.com/RisingStack/trace-nodejs/commit/d1bfd0a))
* Service id can be 0 ([0cd52dc](https://github.com/RisingStack/trace-nodejs/commit/0cd52dc))
* Skip e2e tests for now ([c459d15](https://github.com/RisingStack/trace-nodejs/commit/c459d15))
* Things ([d777a6a](https://github.com/RisingStack/trace-nodejs/commit/d777a6a))
* Update collect interval to 1 min ([b2f27b6](https://github.com/RisingStack/trace-nodejs/commit/b2f27b6))
* Update README with the new logo ([02d7629](https://github.com/RisingStack/trace-nodejs/commit/02d7629))
* Update readme.md ([0219019](https://github.com/RisingStack/trace-nodejs/commit/0219019))
* Update README.md ([8a13e72](https://github.com/RisingStack/trace-nodejs/commit/8a13e72))
* Update README.md ([64e22e4](https://github.com/RisingStack/trace-nodejs/commit/64e22e4))
* Update README.md ([b7b7103](https://github.com/RisingStack/trace-nodejs/commit/b7b7103))
* Update README.md ([1383dd6](https://github.com/RisingStack/trace-nodejs/commit/1383dd6))
* Update the example ([83dcbcf](https://github.com/RisingStack/trace-nodejs/commit/83dcbcf))
* Use span instead of spanids ([5ac0961](https://github.com/RisingStack/trace-nodejs/commit/5ac0961))
* Wrapping https as well ([0d6026e](https://github.com/RisingStack/trace-nodejs/commit/0d6026e))



<a name="1.1.0"></a>
# 1.1.0 (2015-04-17)


* Add hosts to the collector ([e7882b8](https://github.com/RisingStack/trace-nodejs/commit/e7882b8))
* added spanIds to spans ([d05d680](https://github.com/RisingStack/trace-nodejs/commit/d05d680))
* added tests for collector ([e97cbd0](https://github.com/RisingStack/trace-nodejs/commit/e97cbd0))
* Adding adaptive sampling ([a9e1cfe](https://github.com/RisingStack/trace-nodejs/commit/a9e1cfe))
* Adding cls ([db64e80](https://github.com/RisingStack/trace-nodejs/commit/db64e80))
* Adding cover-unit to package.json ([7d1f9a9](https://github.com/RisingStack/trace-nodejs/commit/7d1f9a9))
* Adding dummy spans server ([e2ce46d](https://github.com/RisingStack/trace-nodejs/commit/e2ce46d))
* Adding e2e test to header addition ([13f55b6](https://github.com/RisingStack/trace-nodejs/commit/13f55b6))
* Adding endpoint definition ([f3b7e59](https://github.com/RisingStack/trace-nodejs/commit/f3b7e59))
* ADding event listeneres ([da322ec](https://github.com/RisingStack/trace-nodejs/commit/da322ec))
* Adding headers ([dc2f6cb](https://github.com/RisingStack/trace-nodejs/commit/dc2f6cb))
* Adding http request mock ([9ff4544](https://github.com/RisingStack/trace-nodejs/commit/9ff4544))
* Adding instanbul ([ae4305a](https://github.com/RisingStack/trace-nodejs/commit/ae4305a))
* Adding jshint / jscs ([bf5f3bb](https://github.com/RisingStack/trace-nodejs/commit/bf5f3bb))
* Adding latenct ([389cd6e](https://github.com/RisingStack/trace-nodejs/commit/389cd6e))
* Adding new span based tracing ([f6341fc](https://github.com/RisingStack/trace-nodejs/commit/f6341fc))
* Adding querystring support ([188c66b](https://github.com/RisingStack/trace-nodejs/commit/188c66b))
* Adding test files ([e39da89](https://github.com/RisingStack/trace-nodejs/commit/e39da89))
* Adding test files ([416bc41](https://github.com/RisingStack/trace-nodejs/commit/416bc41))
* Adding test for ClientReceive ([0f1569b](https://github.com/RisingStack/trace-nodejs/commit/0f1569b))
* Adding test for file writing ([df913f4](https://github.com/RisingStack/trace-nodejs/commit/df913f4))
* Adding test services ([9e5c78c](https://github.com/RisingStack/trace-nodejs/commit/9e5c78c))
* Adding uncaugtexceptionhandler ([7c36061](https://github.com/RisingStack/trace-nodejs/commit/7c36061))
* Adding unit test skeleton ([d49d900](https://github.com/RisingStack/trace-nodejs/commit/d49d900))
* Bumping version to 1.1.0 ([30227c7](https://github.com/RisingStack/trace-nodejs/commit/30227c7))
* Collector skeleton ([18014d3](https://github.com/RisingStack/trace-nodejs/commit/18014d3))
* Emit to collector for process.nextTick() ([48ed385](https://github.com/RisingStack/trace-nodejs/commit/48ed385))
* Fixing finished ([5bc1dcc](https://github.com/RisingStack/trace-nodejs/commit/5bc1dcc))
* Fixing request header ([8ea6a03](https://github.com/RisingStack/trace-nodejs/commit/8ea6a03))
* Init ([0d4166f](https://github.com/RisingStack/trace-nodejs/commit/0d4166f))
* Merge branch 'feature/collector' of github.com:RisingStack/seetru into feature/collector ([9b26978](https://github.com/RisingStack/trace-nodejs/commit/9b26978))
* Merge pull request #2 from RisingStack/feature/collector ([b6c88ad](https://github.com/RisingStack/trace-nodejs/commit/b6c88ad))
* Merge pull request #5 from RisingStack/feature/spanId ([9418c8f](https://github.com/RisingStack/trace-nodejs/commit/9418c8f))
* Merge pull request #6 from RisingStack/fixes/test ([18ee1e4](https://github.com/RisingStack/trace-nodejs/commit/18ee1e4))
* Move fake microservices under example ([061a7d4](https://github.com/RisingStack/trace-nodejs/commit/061a7d4))
* Regenerate request-id when sending out client request ([5947d58](https://github.com/RisingStack/trace-nodejs/commit/5947d58))
* removed unnecessary spanIds ([26745a4](https://github.com/RisingStack/trace-nodejs/commit/26745a4))
* Removing console.logs ([3334321](https://github.com/RisingStack/trace-nodejs/commit/3334321))
* Removing seetru.log ([1713097](https://github.com/RisingStack/trace-nodejs/commit/1713097))
* Rename collectors. Renae endpoints ([58efca9](https://github.com/RisingStack/trace-nodejs/commit/58efca9))
* Rename index.js test to e2e ([7ac6c7d](https://github.com/RisingStack/trace-nodejs/commit/7ac6c7d))
* Restructure, fixes ([05570f8](https://github.com/RisingStack/trace-nodejs/commit/05570f8))
* Saving to file ([495bdf7](https://github.com/RisingStack/trace-nodejs/commit/495bdf7))
* Send in every minute ([b8ada90](https://github.com/RisingStack/trace-nodejs/commit/b8ada90))
* Split up seetrue ([68f0928](https://github.com/RisingStack/trace-nodejs/commit/68f0928))
* Wooo, lots of things ([b8af7e9](https://github.com/RisingStack/trace-nodejs/commit/b8af7e9))



