#!/usr/bin/env bash

set -e

if [[ -z $ENV_ESSENTIAL_SOURCED ]]; then
    if [[ $CIRCLE_BRANCH ]]; then
        # CircleCI
        export IS_CI="1"
        export CURRENT_BRANCH=$CIRCLE_BRANCH
        export NODE_TOTAL=$CIRCLE_NODE_TOTAL
        export NODE_INDEX=$CIRCLE_NODE_INDEX
        export PROJECT_REPONAME=$CIRCLE_PROJECT_REPONAME
        export HEAD=$CIRCLE_SHA1
        export SHORT_HEAD=$(echo $HEAD | head -c 7)
        export PROJECT_ROOT=$HOME/$CIRCLE_PROJECT_REPONAME
    else
        # local
        export CURRENT_BRANCH=$(git branch --no-color | awk '/\*/{ print $2 }')
        export NODE_TOTAL=1
        export NODE_INDEX=0
        export PROJECT_REPONAME=$(git config --local remote.origin.url | sed -n 's#.*/\([^.]*\)\.git#\1#p')
        export HEAD=$(git rev-parse HEAD)
        export SHORT_HEAD=$(echo $HEAD | head -c 7)
        export PROJECT_ROOT=$(pwd)
    fi
fi



# don't put common envs here, will be harder to check for missing ones

export ENV_ESSENTIAL_SOURCED="1"
