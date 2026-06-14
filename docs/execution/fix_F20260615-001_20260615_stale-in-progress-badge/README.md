# バグ修正: 計時停止後も「進行中」表示が残る

- **issue / slug**: F20260615-001 / stale-in-progress-badge
- **重大度**: medium
- **実施日**: 2026-06-15
- **対象**: ../README.md（execution）
- **基準 SPEC**: ../001_execution_SPEC.md
- **バグレポート**: 計時を正規に終了したのに、セット一覧の「・進行中」バッジ／`/run` の「『X』が計時中です」復帰導線が残り続ける。
- **状態**: 修正計画済（実装待ち）

## このフォルダに置くドキュメント
- `000_調査レポート.md` — 症状・再現・影響
- `001_ROOT_CAUSE.md` — 5 Whys（根本原因 = done→in-progress query 無効化の対が欠落）
- `002_FIX_PLAN.md` — 修正計画（ExecutionPage の done 検知 effect で invalidate）
- `003_REGRESSION_TEST.md` — 回帰テスト（done でバッジ消滅 unit + E2E）
- `101_FIX_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`）

## 関連
- 起点: ユーザー指定（原メッセージ埋め込み `/flow:fix`）。revise R20260615-001 完了後に別起票。
- 表示導入元: ../revise_R20260614-001_*（進行中バッジ・復帰導線）
