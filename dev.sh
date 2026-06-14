#!/usr/bin/env bash
# Run the full GEOSEO stack locally as a server:
#   API  → http://localhost:4000  (NestJS, Supabase-backed)
#   Web  → http://localhost:3001  (Next.js, proxies /api/v1 → :4000)
#
# Why this script and not `pnpm dev`: the API's start does NOT auto-load
# apps/api/.env, so a bare `pnpm dev` would run it WITHOUT DATABASE_URL/REDIS_URL
# and silently fall back to in-memory (no Supabase). This sources the env first.
#
# Usage:  ./dev.sh        (Ctrl+C stops both)
set -uo pipefail
cd "$(dirname "$0")"

API_PORT="${API_PORT:-4000}"
WEB_PORT="${WEB_PORT:-3001}"

if [ ! -f apps/api/.env ]; then
  echo "⚠️  apps/api/.env not found — the API will run in-memory (no Supabase)."
fi

echo "▶ Starting API on :$API_PORT (env from apps/api/.env)…"
( set -a; [ -f apps/api/.env ] && . ./apps/api/.env; set +a; PORT="$API_PORT" pnpm --filter @geoseo/api start ) &
API_PID=$!

echo "▶ Starting Web on :$WEB_PORT…"
( PORT="$WEB_PORT" pnpm --filter @geoseo/web dev ) &
WEB_PID=$!

echo ""
echo "  API  → http://localhost:$API_PORT/api/v1/health"
echo "  Web  → http://localhost:$WEB_PORT"
echo "  (Ctrl+C to stop both)"

trap 'echo; echo "Stopping…"; kill "$API_PID" "$WEB_PID" 2>/dev/null' EXIT INT TERM
wait
