#!/usr/bin/env bash
set -e
source ../../scripts/util/env-essential.sh
source ../../scripts/util/env-node.sh
source ../../scripts/util/silent.sh

nvm use $NODE_VERSION

rm -rf node_modules
if [[ $(npm -v) == 2* ]]; then
  silent npm link '@risingstack/trace' # faster this way
  silent npm install
else
  silent npm install
  silent npm link '@risingstack/trace'
fi

npm test
