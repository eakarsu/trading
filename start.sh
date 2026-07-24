#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"
if [[ -f .env ]]; then set -a; source .env; set +a; fi

for name in DATABASE_URL JWT_SECRET CORS_ORIGINS; do
  if [[ -z "${!name:-}" ]]; then
    echo "Required environment variable $name is not set" >&2
    exit 1
  fi
done

if [[ "${NODE_ENV:-production}" == "production" && -z "${LICENSED_MARKET_DATA_SOURCES:-}" ]]; then
  echo "Required environment variable LICENSED_MARKET_DATA_SOURCES is not set" >&2
  exit 1
fi

if [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "JWT_SECRET must contain at least 32 characters" >&2
  exit 1
fi

for dependency_dir in backend/node_modules frontend/node_modules; do
  [[ -d "$dependency_dir" ]] || { echo "Missing $dependency_dir; install locked dependencies before startup." >&2; exit 1; }
done
[[ -d frontend/dist ]] || { echo "Missing frontend/dist; run the production build before startup." >&2; exit 1; }

api_port="${PORT:-${BACKEND_PORT:-3001}}"; ui_port="${FRONTEND_PORT:-3000}"
api_host="${HOST:-${BACKEND_HOST:-127.0.0.1}}"; ui_host="${FRONTEND_HOST:-127.0.0.1}"
for port in "$api_port" "$ui_port"; do
  if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port $port is occupied; refusing to terminate another process." >&2; exit 1; fi
done

cleanup() {
  kill -TERM "${api_pid:-}" "${ui_pid:-}" 2>/dev/null || true
  wait "${api_pid:-}" "${ui_pid:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

env HOST="$api_host" PORT="$api_port" npm --prefix backend start & api_pid=$!
npm --prefix frontend run preview -- --host "$ui_host" --port "$ui_port" --strictPort & ui_pid=$!
while kill -0 "$api_pid" 2>/dev/null && kill -0 "$ui_pid" 2>/dev/null; do sleep 1; done
exit 1
