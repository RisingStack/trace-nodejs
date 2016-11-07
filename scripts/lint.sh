#!/usr/bin/env bash
set -e
source $PROJECT_ROOT/scripts/nvm.sh

nvm use $NODE_VERSION

npm run lint
