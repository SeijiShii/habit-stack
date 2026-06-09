# バグ修正: 計時中の経過時間が 00:00 のまま進まない / 開始・現在時刻表示

- **fix id**: C20260610-001
- **起点クレーム**: `../claim_C20260610-001_20260610_timer-frozen-display/001_TRIAGE.md` (decision: D20260610-007)
- **対象機能**: execution
- **severity**: medium
- **状態**: 着手予定（/flow:fix で詳細生成）
- **スコープ**:
  1. 計時中（running/paused）の経過時間をライブ算出・tick 更新で表示（保存値ではなく `now()-startedAt-pausedTotal` を導出）。
  2. 計時中は開始時刻・現在時刻も併記表示。
- **留意**: SPEC「生タイマー不使用（記録方式）」は維持。表示用 tick は描画専用で記録に影響させない。i18n / design-system 準拠。
