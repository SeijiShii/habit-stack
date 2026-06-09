#!/usr/bin/env bash
# post-deploy スモーク: frontend + /api/health + /api/auth/guest (ゲスト認証=Clerk verified 確認)。
# 保護 API (sync/checkout) はセッション必須のため未認証 401 が正常 (=認証ゲート OK)。
# Stripe webhook の配信検証は別途 dashboard テストイベントで。
set -uo pipefail
BASE="${1:-https://habit-stack.givers.work}"
echo "[smoke] BASE=$BASE"

echo "--- GET / (frontend) ---"
curl -s -o /dev/null -w '  / → %{http_code}\n' "$BASE/"

echo "--- GET /api/health ---"
curl -s -o /tmp/smk_h -w '  /api/health → %{http_code}\n' "$BASE/api/health"; echo "    body: $(head -c 160 /tmp/smk_h)"

echo "--- POST /api/auth/guest (期待 200 + ticket = Clerk prod OK) ---"
curl -s -o /tmp/smk_g -w '  /api/auth/guest → %{http_code}\n' -X POST "$BASE/api/auth/guest"
echo "    body: $(head -c 160 /tmp/smk_g | sed -E 's/(ticket"?:?\s*"?)[A-Za-z0-9._-]+/\1<masked>/')"

echo "--- POST /api/sync/pull (未認証 401 = 認証ゲート OK が期待) ---"
curl -s -o /dev/null -w '  /api/sync/pull → %{http_code}\n' -X POST "$BASE/api/sync/pull"
