#!/usr/bin/env bash
# dev プロセス停止（O36）。
pkill -f "vite" 2>/dev/null || true
pkill -f "vercel dev" 2>/dev/null || true
echo "✓ dev プロセスを停止しました"
