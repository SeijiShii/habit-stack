#!/usr/bin/env bash
# habit-stack ローカル開発 launcher（O36）。Vite + (任意で vercel dev)。
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "⚠️  .env.local がありません。.env.example をコピーして実値を入れてください:"
  echo "    cp .env.example .env.local"
fi

echo "▶ 型チェック..."
npx tsc --noEmit

echo "▶ Vite dev server を起動 (http://localhost:5173)"
echo "  API は 'vercel dev' で別途起動できます (npm i -g vercel)"
exec npx vite
