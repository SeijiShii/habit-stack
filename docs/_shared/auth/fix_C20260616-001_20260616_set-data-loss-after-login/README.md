# バグ修正: ログイン状態で活動セットがパーシャル消失

- **fix id**: C20260616-001
- **起点クレーム**: `../claim_C20260616-001_20260616_set-data-loss-after-login/001_TRIAGE.md`（decision: D20260616-003 バグ判定 / D20260616-004 route）
- **severity**: high（不可逆データ消失クラス）
- **対象**: ../README.md（_shared/auth、同期/owner 境界。_shared/local-sync と協働）
- **状態**: 調査中（/flow:fix が引き継ぐ）

## 調査仮説（claim 001_TRIAGE §2.1 から引き継ぎ、優先度順）

1. **deviceOverwrite marker の過剰発火** — churn/再ログインを「既存サインイン＝上書き」と誤判定し `wipeOtherOwners` で保持すべきローカルを削除（`AuthProvider.tsx:91-120,111,181` / `repos.ts:49-53`）。
2. **owner_id 不整合** — 2 セット作成間の guest ticket churn で片方が別 ownerId 永続化 → `reassignOwner`（`dataOps.ts:37`）の全 entity 網羅漏れ → 上書き wipe で片方だけ消失。
3. **wipe の不可逆性 × サーバ未保持** — 削除前に未アップロード（outbox 滞留 / 未連携 owner）だとローカル削除＝恒久喪失。wipe をサーバ反映確認後に限定すべきか。
4. **soft-delete / sync 経路** — 夕方セットへの `deletedAt` 誤付与（強制停止データ消失是正の残存）または last-write-wins で古い/削除状態を pull → `getAllByOwner`（`localStore.ts:82` 未削除のみ）から脱落。

## このフォルダのドキュメント（/flow:fix が生成）
- `000_調査レポート.md` / `001_ROOT_CAUSE.md` / `002_FIX_PLAN.md` / `003_REGRESSION_TEST.md` / `004_POSTMORTEM.md`（データ消失系のため推奨）
