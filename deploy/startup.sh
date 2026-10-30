#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${API_BASE_URL:-}" ]]; then
  echo "API_BASE_URL must be set in the App Service application settings." >&2
  exit 1
fi

node <<'NODE'
const fs = require('node:fs');

const value = process.env.API_BASE_URL.trim();
let apiUrl;

try {
  apiUrl = new URL(value);
} catch {
  throw new Error('API_BASE_URL must be an absolute HTTP or HTTPS URL.');
}

if (
  !['http:', 'https:'].includes(apiUrl.protocol) ||
  apiUrl.username ||
  apiUrl.password ||
  apiUrl.search ||
  apiUrl.hash
) {
  throw new Error(
    'API_BASE_URL must be an HTTP or HTTPS URL without credentials, query parameters, or a fragment.'
  );
}

fs.writeFileSync(
  '/home/site/wwwroot/runtime-config.json',
  JSON.stringify({ apiBaseUrl: apiUrl.href.replace(/\/+$/, '') }),
  { mode: 0o644 }
);
NODE

exec pm2 serve /home/site/wwwroot --no-daemon --spa
