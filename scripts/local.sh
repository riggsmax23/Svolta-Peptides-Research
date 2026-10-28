#!/bin/sh
set -eu
runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies"
if [ -x "$runtime/node/bin/node" ] && [ -x "$runtime/bin/fallback/pnpm" ]; then
  PATH="$runtime/node/bin:$PATH"
  export PATH
  exec "$runtime/bin/fallback/pnpm" "$@"
fi
exec pnpm "$@"
