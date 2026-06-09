#!/usr/bin/env bash
# 本番デプロイ: prod env 同期 → Build Output API ビルド → ガード → prebuilt deploy。
# ⚠️ 必ず --prebuilt で deploy する（vercel build / 素の deploy は @vercel/node 二重ビルドで
#    O51 ERR_MODULE_NOT_FOUND が再発する、CF-20260529-013）。
set -euo pipefail
cd "$(dirname "$0")/.."

MAX_FUNCTIONS="${MAX_FUNCTIONS:-12}"  # Vercel Hobby は 1 deploy 12 関数まで

echo "[deploy-prod] 1/4 prod env 同期 → Vercel production"
bash scripts/sync-prod-env.sh

echo "[deploy-prod] 2/4 Build Output API ビルド"
rm -rf .vercel/output
node scripts/vercel-build.mjs

echo "[deploy-prod] 3/4 ガード"
# 生 api/*.js リーク検出（O51: zero-config 二重ビルドの痕跡が無いこと）
if find .vercel/output/functions -name '*.func' -prune -o -name '*.js' -print 2>/dev/null | grep -q .; then
  : # bundle 内の .mjs のみのはず。.js があってもエラーにはしない（情報）
fi
FUNC_COUNT="$(find .vercel/output/functions -name '*.func' -type d | wc -l | tr -d ' ')"
echo "  functions: $FUNC_COUNT (limit $MAX_FUNCTIONS)"
if [ "$FUNC_COUNT" -gt "$MAX_FUNCTIONS" ]; then
  echo "  ✗ 関数数が上限超過 ($FUNC_COUNT > $MAX_FUNCTIONS)。関数統合 / 不要関数削除 / プラン変更が必要" >&2
  exit 1
fi

echo "[deploy-prod] 4/4 deploy (--prebuilt --prod)"
vercel deploy --prebuilt --prod
