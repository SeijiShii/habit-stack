# 改修: セルフサービス全データ削除の UI 導線実装（O54 消去権）

- **issue / slug**: R20260611-002 / self-service-delete
- **実施日**: 2026-06-11
- **対象機能**: ../README.md（_shared/auth）
- **基準 SPEC**: ../001__shared_auth_SPEC.md
- **改修要望**: AUDIT_20260611_2000 Critical [AUDIT-perspective-001]。プラポリ（content.ts:25）+ 利用規約（:41）が「アプリ内のセルフサービス機能で全データ削除をいつでも実行できる」と約束しているが、`deleteAllData`（dataOps.ts:26）の UI 呼び出し元がゼロで AccountPage に削除導線が無い。本番公開済みアプリで消去権が履行不能（個情法/GDPR、O54/O12×O22）。
- **状態**: 設計完了 → tdd

## このフォルダに置くドキュメント
- `001_REVISE_SPEC.md` — 変更仕様（AccountPage 削除導線 + サーバ/ローカル purge）
- `002_REVISE_PLAN.md` — 変更計画（新規 API + purge サービス + AccountPage 改修）
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- （MIGRATION 不要 — DB スキーマ変更なし）

## 関連
- 監査レポート: ../../../AUDIT_20260611_2000.md
- 法務 SPEC: ../../legal/001__shared_legal_SPEC.md（プラポリ N2 文言）
- 削除ロジック: src/services/auth/dataOps.ts（deleteAllData）/ src/services/sync/localStore.ts（wipeOwner）
