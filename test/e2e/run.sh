#!/usr/bin/env bash
set -e
source $PROJECT_ROOT/scripts/nvm.sh
source $PROJECT_ROOT/scripts/util.sh

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
