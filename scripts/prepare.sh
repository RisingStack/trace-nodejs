#!/usr/bin/env bash
set -e
source $PROJECT_ROOT/scripts/nvm.sh
source $PROJECT_ROOT/scripts/util.sh

nvm use $NODE_VERSION

rm -rf node_modules
silent npm install
silent npm link
