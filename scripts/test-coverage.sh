#!/usr/bin/env bash
set -e
source ./scripts/util/env-essential.sh
source ./scripts/util/env-node.sh

nvm use $NODE_VERSION

if [[ -n $CIRCLE_ARTIFACTS ]]; then
    dir=$CIRCLE_ARTIFACTS/v$NODE_VERSION
else
    dir=./coverage/v$NODE_VERSION
fi

istanbul=$(npm run which --loglevel silent -- istanbul)
mocha=$(npm run which --loglevel silent -- _mocha)

$istanbul cover $mocha 'lib/**/*.spec.js' --dir $dir
