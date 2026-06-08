# auth

認証・認可基盤（Clerk 匿名ゲスト → 段階的認証 + ゲスト→アカウント連携データ引き継ぎ）

## このフォルダに置くドキュメント

- `001_auth_SPEC.md` — 仕様書（`/flow:feature` で生成）
- `002_auth_PLAN.md` — 実装計画書
- `003_auth_UNIT_TEST.md` — 単体テスト計画
- `004_auth_E2E_TEST.md` — E2E テスト計画
- `estimate_YYYYMMDD.md` — 機能単位見積もり（`/flow:estimate`）

## 関連

- 概念設計: `../../concept.md` §1.3.2
- 全体見積: `../../estimates/`
- 実装コード対応: `§1.4 の対応表参照（横断は集約 → 分散実装）`（§1.4 参照）
- 依存: _shared/db
- 優先度: 2 ／ 基盤: ✅
