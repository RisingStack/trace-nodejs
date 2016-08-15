#!/usr/bin/env bash
set -e

sudo apt-get update -y

sudo apt-get install -y \
  ca-certificates \
  curl \
  python \
  build-essential

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.4/install.sh | bash
