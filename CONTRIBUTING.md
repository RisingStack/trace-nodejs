# Guidelines for contributing to trace-nodejs

RisingStack welcomes contributions for the trace-nodejs package by anyone who'd
like to make it better!

To make everyone's life easier, please follow this guidelines on how you can do
that.

## Legal

By sending pull request you agree to grant RisingStack, Inc. perpetual,
irrevocable, non-exclusive, worldwide, no-charge, royalty-free, unrestricted
license in the code, algorithms, idea, object code, patch, tool, sample,
graphic, specification, manual or documentation (“Your Contribution”) to
reproduce, publicly display, publicly perform, sublicense, and distribute Your
Contribution and such derivative works. You provide your contributions on an "as
is" basis, without warranties of any kind, including warranties of correctness
or fitness for a particular purpose.

## Code compatibility

The library code is required to run on target platforms Node.js >=v0.10 (Node >=
v0.12 for 3.x.x) without transpilation. This means the code should fully adhere to the
ES5 standard: **Use only ES5 compatible language features**.

Most notable gotchas without completeness:

 - No classes with `class`
 - No arrow functions
 - No object method shorthand
 - No property assignment shorthand
 - No rest parameters, no destructuring
 - A lot of `Array` and `Object` methods you have in ES6 are missing from earlier versions.

> When you are in doubt about the compatibility of a language specific feature check on [Mozilla Developer Network](mdn)!

Moreover, the code must be compatible with target Node.js
APIs. As these remain mostly backward compatible, (functionality is added,
seldom removed) this boils down to finding the common subset of features and in
turn looking at the earliest supported version's feature set.

A few points to mention:
 - Sync APIs were introduced in v0.12, v0.10 misses these.
 - Streams API were largely extended in later versions.

## Source code style

We use [ESLint](eslint) for code linting.

### ESLint config

We use an ESLint configuration called [Standard Style](stdjs).

An incomplete list of rules:
 - 2 spaces – for indentation
 - Single quotes for strings – except to avoid escaping
 - No unused variables – this one catches tons of bugs!
 - No semicolons
 - Never start a line with (, [, or \` This is the only gotcha with omitting
semicolons – automatically checked for you!
 - Space after keywords
 - Space after function name
 - Always use `===` instead of `==` – but `obj == null` is allowed to check `null || undefined`.
 - Always handle the node.js `err` function parameter

### Functional vs imperative

Code clarity is an important to us. Immutable data provides easier effect tracking
therefore lesser cognitive overhead when understanding code of others. The
fundamental program composition model of functional programming is based on
function composition rather than state. However, keep in mind that Javascript is
not a functional language. Using idiomatic language constructs even in presence
of side effects enhances collaboration, and helps writing performant code. This
requires you to keep a balance of imperative and functional code. The following
rule of thumbs will help you:

 - encapsulate and segregate state. Don't keep
stateful objects all over the place, rather in reservoirs. Use private
properties (starting with an \_underscore) to encapsulate state that should not
be accessed from outside.

 - use resourceful state in a controlled manner, for
example provide state management functions for native timers.

 - Keep in mind that function calls in instrumentation wrapper code will be
 present in the stack trace if an error happens in the target library. So
 - keep function call chains as shallow as possible.

### Error tolerant instrumentation code

It is very important that the
instrumentation hooks are tolerant to misuse. We should expect errors to be
present in user code interfacing with the instrumented libraries. In this case
it should be left to the instrumented library to handle the error, so that our
intermediate layer remains as transparent as possible.

## Code organization
```
.
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── circle.yml
├── coverage
├── example           There is an example app here.
├── lib               Source code goes here, along with unit tests.
├── package.json
├── scripts           Build, test, deployment scripts.
└── test              All tests except unit tests.
```

Keep the unit tests next to their corresponding source files. This makes it
easier to navigate between them.

## Guidelines about package dependencies

Keep in mind at all times that the code will run on clients' machines. Every
dependency consumes some disk space, adds memory overhead (when loaded), network
overhead on install. Native modules make build times longer with a
non-negligible amount (if they are allowed to be built at all). Additionally
every new dependency or update adds the possibility to introduce a bug, a
regression or a security hole. To minimize exposure to such adverse effects,
following rules must be adhered to.

### Evaluation

Before adding a dependency first ask yourself:

#### How does this package help?

Summarize why this particular package helps solving your problem.

#### Is it really needed, can I achieve my goal without it? If I can what are the
trade-offs (very complex, missing knowledge in domain)?

Some packages do not simplify your problem too much. Those that add syntactic
sugar for control structures, validation shortcuts, or those that try to solve a
very complex general problem that you are facing may not be the best candidate
for inclusion. However if it solves a specific hard mathematical or domain
specific problem, eg. cryptographic or compression algorithms, protocol
implementations, use it. Another particular kind is polyfills and lodash-like
helpers, these are generally acceptable, just use them if you really need to.

#### Can I find a more mature one? Better maintained, used by more projects, etc.

This should go without further explanation.

#### Is there a package covering my needs with smaller footprint? Less transitive dependencies, optional native deps, etc.

Prefer modular packages, avoid kitchen sinks. For example, use lodash.find and
lodash.defaults instead of depending on the whole lodash module, if you need
only those two methods.

Prefer flat packages, that is, avoid ones with big dependency subtrees. Remember the leftpad scandal.

#### Is it a native module or does it include a native dependency? Is it optional?

To build native dependencies the native compiler build chain is required as well
as some additional dependencies. Often on production systems these are not
present because of security reasons. Prebuilding can be done but complicates
distribution, therefore currently we do not do it. This means currently every
native dependency must be optional, so the software needs to function (possibly
with limited feature set and/or performance) without them.

### Adding the dependency

**Lock the dependency!** Production dependencies must be locked in package.json. This means that semver
ranges are not allowed. The reason behind this is our experience with
change management in npm packages. There is a possibility that they introduce
breaking changes even on patch level, and it is always harder to provide support
for a range of possible versions.

[mdn]: https://developer.mozilla.org/en-US/docs/Web/JavaScript
[eslint]: http://eslint.org/
[stdjs]: http://standardjs.com/
