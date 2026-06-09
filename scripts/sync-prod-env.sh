#!/usr/bin/env bash
# .env.production.local の各 var を Vercel production env に冪等同期する。
# 値はマスク表示（末尾4桁）。agent が raw secret を chat に出さないための独立スクリプト。
# 前提: vercel CLI ログイン済（quadii）、vercel link 済。
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.production.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "✗ $ENV_FILE 不在。cp .env.production.example .env.production.local して live 実キーを入れてください" >&2
  exit 1
fi

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*) continue ;; esac
  key="${line%%=*}"
  val="${line#*=}"
  # 「空白 + # 以降」のインラインコメントのみ除去（DATABASE_URL の ?a=b&c=d は壊さない）
  val="$(printf '%s' "$val" | sed -E 's/[[:space:]]+#.*$//; s/^[[:space:]]+//; s/[[:space:]]+$//')"
  [ -z "$key" ] && continue
  if [ -z "$val" ]; then
    echo "  - $key (空) → production から削除"
    vercel env rm "$key" production -y >/dev/null 2>&1 || true
    continue
  fi
  echo "  + $key = …${val: -4}"
  vercel env rm "$key" production -y >/dev/null 2>&1 || true
  printf '%s' "$val" | vercel env add "$key" production >/dev/null 2>&1
done < "$ENV_FILE"

echo "[sync-prod-env] done"
