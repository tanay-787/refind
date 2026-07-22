set -euo pipefail

export EXPO_TUNNEL_SUBDOMAIN="ss-search"
export EDGE_PATH=/usr/bin/microsoft-edge-stable

cd /devspace/projects/ss-search

pnpm start --tunnel