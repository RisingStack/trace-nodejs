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
        export COMMIT_MESSAGE=$(git log -1 --pretty=%B)
        export COMMIT_AUTHOR=$(git log -1 --pretty=%an)
        if [[ "$COMMIT_AUTHOR" == "risingbot" ]] || [[ $(echo $COMMIT_MESSAGE | sed -n 's/^chore(bump):/&/p') ]]; then
            export SKIP_BUILD="1"
        fi
        export REPOSITORY_URL=$CIRCLE_REPOSITORY_URL
        if [[ -n "$REPOSITORY_URL" ]] && [[ -n "$GH_TOKEN" ]]; then
           export REPOSITORY_PUSH_URL=$(echo $REPOSITORY_URL | sed -r "s|https?://(.+)/|https://risingbot:$GH_TOKEN@\1/|")
        fi
        export NODE_VERSION=$NODE_VERSION_FW
    else
        # local
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
        export NODE_VERSION_FW=6
        export NODE_VERSION=$NODE_VERSION_FW
    fi
fi



# don't put common envs here, will be harder to check for missing ones

export ENV_ESSENTIAL_SOURCED="1"
