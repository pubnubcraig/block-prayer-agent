#!/bin/sh
set -e
# blocks-run loads .env, agent-card.json, and handler.ts (via SDK + tsx)
exec ./node_modules/.bin/blocks-run
