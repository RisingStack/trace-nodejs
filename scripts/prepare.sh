#!/usr/bin/env bash
set -e
source ./scripts/util/env-essential.sh
source ./scripts/util/env-node.sh
source ./scripts/util/silent.sh

nvm use $NODE_VERSION

rm -rf node_modules
silent npm install
silent npm link
