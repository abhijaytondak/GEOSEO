#!/usr/bin/env bash
# Safely expose LOCAL Ollama to the hosted (Render) API.
#
#   Render API ──HTTPS──> public tunnel ──> auth-proxy(:11435) ──bearer──> Ollama(:11434)
#
# The auth-proxy rejects anything without the exact bearer secret, so the public
# tunnel never exposes an unauthenticated LLM. The engine already sends
# `Authorization: Bearer ${DEEPSEEK_API_KEY}` — set that env on Render to the secret.
#
# Usage:  OLLAMA_PROXY_SECRET=<64-hex> ./ollama-prod-bridge.sh [ngrok|cloudflared]
#   (generate a secret once:  openssl rand -hex 32 )
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TUNNEL="${1:-ngrok}"
: "${OLLAMA_PROXY_SECRET:?set OLLAMA_PROXY_SECRET (e.g. \`export OLLAMA_PROXY_SECRET=\$(openssl rand -hex 32)\`)}"
PROXY_PORT="${PROXY_PORT:-11435}"

echo "▶ starting auth-proxy on 127.0.0.1:${PROXY_PORT} → Ollama :11434"
OLLAMA_PROXY_SECRET="$OLLAMA_PROXY_SECRET" PROXY_PORT="$PROXY_PORT" node "$HERE/ollama-auth-proxy.mjs" &
PROXY_PID=$!
trap 'kill $PROXY_PID 2>/dev/null || true' EXIT
sleep 1
curl -fsS "http://127.0.0.1:${PROXY_PORT}/healthz" >/dev/null && echo "  proxy healthy"

echo "▶ opening public tunnel via ${TUNNEL} (Ctrl-C to stop everything)"
if [ "$TUNNEL" = "cloudflared" ]; then
  echo "  → set Render env: DEEPSEEK_BASE_URL=https://<the trycloudflare URL>/v1"
  exec cloudflared tunnel --url "http://127.0.0.1:${PROXY_PORT}"
else
  echo "  → set Render env: DEEPSEEK_BASE_URL=https://<the ngrok URL>/v1"
  echo "  → DEEPSEEK_API_KEY=${OLLAMA_PROXY_SECRET}"
  echo "  → DEEPSEEK_MODEL=qwen2.5-coder:latest   (and LLM_TIMEOUT_MS=240000)"
  exec ngrok http "${PROXY_PORT}"
fi
