#!/bin/sh
set -eu

export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export DATABASE_URL="${DATABASE_URL:-file:/data/dev.db}"

mkdir -p /data /app/public/uploads

npm run prisma:deploy

exec npm run start -- --hostname "${HOSTNAME}" --port "${PORT}"
