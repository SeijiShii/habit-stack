#!/usr/bin/env bash
# 本番 Neon DB へ drizzle マイグレーションを適用する。
# DATABASE_URL は .env.production.local から read+export で読む（& を壊さない / 値は出さない）。
# ⚠️ drizzle-kit migrate は direct 接続 (-pooler 無し URL) を要する場合あり。
#    pooler URL で失敗したら .env.production.local の DATABASE_URL を direct に差し替えて再実行。
set -euo pipefail
cd "$(dirname "$0")/.."

F=.env.production.local
[ -f "$F" ] || { echo "✗ $F 不在" >&2; exit 1; }
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*) continue ;; esac
  key="${line%%=*}"; val="${line#*=}"
  val="$(printf '%s' "$val" | sed -E 's/[[:space:]]+#.*$//; s/^[[:space:]]+//; s/[[:space:]]+$//')"
  [ -z "$key" ] && continue
  export "$key=$val"
done < "$F"

echo "[migrate-prod] applying migrations to prod Neon…"
npx drizzle-kit migrate
echo "[migrate-prod] done"
