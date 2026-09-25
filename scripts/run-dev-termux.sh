#!/bin/sh
# Portable re-exec under bash for environments where /bin/sh is minimal (e.g. Android mksh)
if [ -z "$BASH_VERSION" ]; then
  if command -v bash >/dev/null 2>&1; then
    exec bash "$0" "$@"
  fi
fi

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

export EXPO_TUNNEL_SUBDOMAIN="${EXPO_TUNNEL_SUBDOMAIN:-ss-search}"

# If Microsoft Edge exists (e.g. if installed in a desktop/proot environment), keep EDGE_PATH
if [ -z "${EDGE_PATH:-}" ] && [ -x "/usr/bin/microsoft-edge-stable" ]; then
  export EDGE_PATH="/usr/bin/microsoft-edge-stable"
fi

echo "🚀 Starting Expo development server for Termux..."
echo "📂 Project root: $PROJECT_ROOT"

# Pass through arguments if provided, otherwise default to --localhost
if [ "$#" -gt 0 ]; then
  exec pnpm start -- "$@"
else
  echo "ℹ️ Defaulting to --localhost (run with --tunnel, --lan, or -c if needed)"
  exec pnpm start -- --localhost
fi
