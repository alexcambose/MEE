#!/bin/bash
set -a
source .env
set +a

anvil --fork-url $FORK_URL > anvil.log 2>&1 &
sleep 5
docker compose up -d
tail -f anvil.log
