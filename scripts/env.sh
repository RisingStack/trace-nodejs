#!/usr/bin/env bash
set -e

DEFAULT_NODE_VERSION=8

if [[ -z $ENV_ESSENTIAL_EXPORTS ]]; then
    if [[ $CIRCLE_BRANCH ]]; then # Runs on CircleCI
        export IS_CI="1"
        export CURRENT_BRANCH=$CIRCLE_BRANCH
        export NODE_TOTAL=$CIRCLE_NODE_TOTAL
        export NODE_INDEX=$CIRCLE_NODE_INDEX
        export PROJECT_REPONAME=$CIRCLE_PROJECT_REPONAME
        export HEAD=$CIRCLE_SHA1
        export SHORT_HEAD=$(echo $HEAD | head -c 7)
        export PROJECT_ROOT=$HOME/$CIRCLE_PROJECT_REPONAME
        export COMMIT_MESSAGE=$(git log -1 --pretty=%B)
        export COMMIT_AUTHOR=$(git log -1 --pretty=%an)
        export REPOSITORY_URL=$CIRCLE_REPOSITORY_URL
        if [[ -z $TOOL_NODE_VERSION ]]; then
            export TOOL_NODE_VERSION=$DEFAULT_NODE_VERSION
        fi
        if [[ -z $NODE_VERSION ]]; then
            export NODE_VERSION=$TOOL_NODE_VERSION
        fi
    else # Runs locally
        export CURRENT_BRANCH=$(git branch --no-color | awk '/\*/{ print $2 }')
        export NODE_TOTAL=1
        export NODE_INDEX=0
        export PROJECT_REPONAME=$(git config --local remote.origin.url | sed -n 's#.*/\([^.]*\)\.git#\1#p')
        export HEAD=$(git rev-parse HEAD)
        export SHORT_HEAD=$(echo $HEAD | head -c 7)
        export PROJECT_ROOT=$(pwd)
        export COMMIT_MESSAGE=$(git log -1 --pretty=%B)
        export COMMIT_AUTHOR=$(git log -1 --pretty=%an)
        export REPOSITORY_URL=$(git config --get remote.origin.url)
        export REPOSITORY_PUSH_URL=$REPOSITORY_URL
        if [[ -z $TOOL_NODE_VERSION ]]; then
            export TOOL_NODE_VERSION=$DEFAULT_NODE_VERSION
        fi
        export NODE_VERSION_FW=$DEFAULT_NODE_VERSION
        if [[ -z $NODE_VERSION ]]; then
            export NODE_VERSION=$TOOL_NODE_VERSION
        fi
    fi
fi

[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use $NODE_VERSION > /dev/null || nvm install $NODE_VERSION

function print_node() {
    echo '********************************'
    echo '*' node:$(printf "%9s" $(node --version)) '|' npm:$(printf "%9s" $(npm --version)) '*'
    echo '********************************'
}

export ENV_ESSENTIAL_EXPORTS="1"
