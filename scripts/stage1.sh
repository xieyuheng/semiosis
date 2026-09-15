#!/usr/bin/env bash

set -e

# stage1 -- js/ts code

# ts format

./scripts/run-in.sh std.js format.sh
./scripts/run-in.sh cli.js format.sh
./scripts/run-in.sh agent.js format.sh

# ts check

./scripts/run-in.sh std.js check.sh
./scripts/run-in.sh cli.js check.sh
./scripts/run-in.sh agent.js check.sh

# ts test

./scripts/run-in.sh std.js clean.sh test.sh
./scripts/run-in.sh cli.js clean.sh test.sh
./scripts/run-in.sh agent.js clean.sh test.sh
