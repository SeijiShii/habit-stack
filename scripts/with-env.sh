#!/usr/bin/env bash
# DEV CLI env launcher（CF-20260528-015）: .env → .env.local → .env.development.local を
# dotenv 互換 parse で export してから <cmd> を実行する。
# 用途: drizzle-kit / playwright 等 env 自動 load されない CLI を `bash scripts/with-env.sh <cmd>` で wrap。
# 注: bash の `source` は URL query の & を壊すため read+export で実装。
set -euo pipefail
cd "$(dirname "$0")/.."

for f in .env .env.local .env.development.local; do
  [ -f "$f" ] || continue
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|\#*) continue ;; esac
    key="${line%%=*}"
    val="${line#*=}"
    val="$(printf '%s' "$val" | sed -E 's/[[:space:]]+#.*$//; s/^[[:space:]]+//; s/[[:space:]]+$//')"
    [ -z "$key" ] && continue
    export "$key=$val"
  done < "$f"
done

exec "$@"
