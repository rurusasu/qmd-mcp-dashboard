#!/bin/bash
set -e

# Claude Code on the Web - setup script
# This script runs before each new session on Anthropic's cloud VM.

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ -d "$REPO_ROOT/dashboard" ]; then
  cd "$REPO_ROOT/dashboard"
  npm install
  echo "[setup] dashboard dependencies installed"
else
  echo "[setup] WARNING: dashboard/ directory not found at $REPO_ROOT" >&2
  exit 1
fi
