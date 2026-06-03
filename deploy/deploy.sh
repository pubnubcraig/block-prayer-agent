#!/usr/bin/env bash
# Pull latest code and (re)start the stack on the EC2 host.
# Run from /opt/app (the cloned repo). Requires /opt/app/.env to exist.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Create it with OPENAI_API_KEY, YOUVERSION_APP_KEY, BLOCKS_API_KEY." >&2
  exit 1
fi

echo "==> Pulling latest code"
git pull --ff-only || echo "(skipping git pull)"

echo "==> Building and starting containers"
docker compose -f docker-compose.aws.yml up -d --build

echo "==> Pruning old images"
docker image prune -f >/dev/null 2>&1 || true

echo "==> Status"
docker compose -f docker-compose.aws.yml ps
