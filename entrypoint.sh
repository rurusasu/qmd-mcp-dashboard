#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/share/pnpm:$PNPM_HOME:$PATH"

# QMD stores its DB at ~/.cache/qmd/index.sqlite
# Symlink to PVC so data persists across restarts
QMD_CACHE="/home/node/.cache/qmd"
QMD_DATA="${QMD_DATA_DIR:-/data/qmd}"

# Verify PVC is mounted (prevent silent data loss to ephemeral storage)
if ! mountpoint -q "$(dirname "$QMD_DATA")" 2>/dev/null && ! mountpoint -q "$QMD_DATA" 2>/dev/null; then
  echo "[QMD-MCP] FATAL: $QMD_DATA is not on a persistent mount. PVC may not be attached." >&2
  exit 1
fi

# Remove anything that isn't already a correct symlink (prevents silent data loss)
if [ -e "$QMD_CACHE" ] && [ ! -L "$QMD_CACHE" ]; then
  echo "[QMD-MCP] WARNING: $QMD_CACHE exists but is not a symlink. Removing." >&2
  rm -rf "$QMD_CACHE"
fi

mkdir -p "$(dirname "$QMD_CACHE")"
ln -sfn "$QMD_DATA" "$QMD_CACHE"

# Verify symlink
ACTUAL_TARGET=$(readlink -f "$QMD_CACHE")
EXPECTED_TARGET=$(readlink -f "$QMD_DATA")
if [ "$ACTUAL_TARGET" != "$EXPECTED_TARGET" ]; then
  echo "[QMD-MCP] FATAL: Symlink verification failed. Expected $QMD_DATA, got $ACTUAL_TARGET" >&2
  exit 1
fi
echo "[QMD-MCP] Verified: $QMD_CACHE -> $QMD_DATA"

# Dashboard startup
echo "[QMD-MCP] Starting dashboard on port 3003..."
PORT=3003 HOSTNAME=0.0.0.0 node /app/dashboard/server.js &

echo "[QMD-MCP] Starting QMD MCP server on port 3001 via supergateway..."
exec supergateway \
  --stdio "qmd mcp" \
  --outputTransport streamableHttp \
  --port 3001 \
  --host 0.0.0.0
