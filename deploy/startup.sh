#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${API_BASE_URL:-}" ]]; then
  echo "API_BASE_URL must be set in the App Service application settings." >&2
  exit 1
fi

exec node /home/site/wwwroot/server.js
