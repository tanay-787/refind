#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

export EXPO_TUNNEL_SUBDOMAIN="${EXPO_TUNNEL_SUBDOMAIN:-refind}"
if [ -z "${EDGE_PATH:-}" ] && [ -x "/usr/bin/microsoft-edge-stable" ]; then
  export EDGE_PATH="/usr/bin/microsoft-edge-stable"
fi

cd "$PROJECT_ROOT"

exec pnpm start --tunnel "$@"