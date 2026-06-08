# local-sync

local-first 同期層（IndexedDB + Neon 同期キュー、タイムスタンプ方式、競合解決）

## このフォルダに置くドキュメント

- `001_local-sync_SPEC.md` — 仕様書（`/flow:feature` で生成）
- `002_local-sync_PLAN.md` — 実装計画書
- `003_local-sync_UNIT_TEST.md` — 単体テスト計画
- `004_local-sync_E2E_TEST.md` — E2E テスト計画
- `estimate_YYYYMMDD.md` — 機能単位見積もり（`/flow:estimate`）

## 関連

- 概念設計: `../../concept.md` §1.3.2
- 全体見積: `../../estimates/`
- 実装コード対応: `§1.4 の対応表参照（横断は集約 → 分散実装）`（§1.4 参照）
- 依存: _shared/db, _shared/types
- 優先度: 2 ／ 基盤: ✅
