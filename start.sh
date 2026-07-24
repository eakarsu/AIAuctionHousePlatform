#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test -f "$root/.env" || { echo 'Missing .env; copy .env.example.' >&2; exit 1; }
test -d "$root/backend/node_modules" && test -d "$root/frontend/node_modules" || { echo 'Dependencies missing; run scripts/bootstrap.sh.' >&2; exit 1; }
set -a
source "$root/.env"
set +a
: "${BACKEND_PORT:=30044}" "${FRONTEND_PORT:=30045}"
[[ "$BACKEND_PORT" =~ ^[0-9]+$ && "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || { echo 'Backend and frontend ports must be numeric.' >&2; exit 2; }
test "$BACKEND_PORT" != "$FRONTEND_PORT" || { echo 'Backend and frontend ports must be different.' >&2; exit 2; }
for assigned_port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -tiTCP:"$assigned_port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Assigned port $assigned_port is already in use; no process was stopped." >&2
    exit 1
  fi
done

(cd "$root/backend" && npm start) & backend_pid=$!
(cd "$root/frontend" && npm start -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort) & frontend_pid=$!
cleanup() {
  trap - EXIT INT TERM
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
wait "$backend_pid" "$frontend_pid"
