#!/bin/sh
set -e
cd -- "$(dirname -- "$0")/../.."

if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js is required. Use Node 22.12+ or 24, then run this launcher again.' >&2
  exit 1
fi

printf '%s\n' 'Flow Lens local playground: http://127.0.0.1:5314'
printf '%s\n' 'Keep this Terminal window open. Press Control-C to stop the preview.'
exec node node_modules/vite/bin/vite.js --config examples/local-playground/vite.config.ts
