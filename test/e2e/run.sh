#!/usr/bin/env bash
set -e
source ../../scripts/util/env-essential.sh
source ../../scripts/util/env-node.sh

nvm use $NODE_VERSION

rm -rf node_modules
if [[ $(npm -v) == 2* ]]; then
  npm link '@risingstack/trace' >/dev/null 2>&1 # faster this way
  npm install >/dev/null 2>&1
else
  npm install >/dev/null 2>&1
  npm link '@risingstack/trace' >/dev/null 2>&1
fi

npm test
