#!/bin/bash
set -e

# Claude Code on the Web - setup script
# This script runs before each new session on Anthropic's cloud VM.
#
# Cloud environment setup script should be:
#   #!/bin/bash
#   bash setup.sh

# Detect repo root from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

cd "$REPO_ROOT"
echo "[setup] repo root: $REPO_ROOT"

if [ -d "dashboard" ]; then
  cd dashboard
  npm install
  echo "[setup] dashboard dependencies installed"
else
  echo "[setup] ERROR: dashboard/ directory not found at $REPO_ROOT" >&2
  exit 1
fi
