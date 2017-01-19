#!/usr/bin/env bash
set -e
source ./scripts/util/env-node.sh

nvm use $NODE_VERSION

if [[ -n $CIRCLE_ARTIFACTS ]]; then
    dir=$CIRCLE_ARTIFACTS/v$NODE_VERSION
else
    dir=./coverage/v$NODE_VERSION
fi

npm run cover -- --dir $dir
