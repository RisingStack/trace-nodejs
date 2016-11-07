#!/usr/bin/env bash
set -e

sudo apt-get update -y

sudo apt-get install -y \
  git \
  ca-certificates \
  curl \
  python \
  build-essential

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
