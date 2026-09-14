#!/usr/bin/env bash

set -e

# 进入 packages/<pkg>，依次运行其 scripts/<script>...
# 用法：./scripts/run-in.sh <pkg> <script>...
cd "$(dirname "$0")/.."
cd "packages/$1"
shift
for script in "$@"; do
  ./scripts/"$script"
done