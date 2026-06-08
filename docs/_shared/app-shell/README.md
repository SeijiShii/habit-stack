# app-shell

アプリ合成レイヤ（合成ルート + UI↔data 配線 + API ルートハンドラ層 + Clerk セッション確立 + PWA + deploy scaffold、O57）

## このフォルダに置くドキュメント

- `001_app-shell_SPEC.md` — 仕様書（`/flow:feature` で生成）
- `002_app-shell_PLAN.md` — 実装計画書
- `003_app-shell_UNIT_TEST.md` — 単体テスト計画
- `004_app-shell_E2E_TEST.md` — E2E テスト計画
- `estimate_YYYYMMDD.md` — 機能単位見積もり（`/flow:estimate`）

## 関連

- 概念設計: `../../concept.md` §1.3.2
- 全体見積: `../../estimates/`
- 実装コード対応: `§1.4 の対応表参照（横断は集約 → 分散実装）`（§1.4 参照）
- 依存: 全 feature + 全 _shared
- 優先度: 最後 ／ 基盤: ❌
