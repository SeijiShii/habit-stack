# 実装レポート: _shared/auth R20260611-002（セルフサービス全データ削除）

## 実装日時
2026-06-11 20:14 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md] — 変更仕様
- [002_REVISE_PLAN.md] — 変更計画
- [003_REVISE_UNIT_TEST.md] — 単体テスト計画
- [AI_LOG セッション](../../../AI_LOG/D20260611_008_tdd__shared_auth_revise_R20260611-002.md)
- 起点: [AUDIT_20260611_2000.md](../../../AUDIT_20260611_2000.md) Critical [AUDIT-perspective-001]

## 注意事項
本レポートのファイルパス・行番号は実装日時時点のもの。

## 変更一覧

### Phase 1: サーバ削除 API
- **新規 `api/account/delete.ts`**: `makeDeleteHandler(adapter, db)` = `withOwner` で owner 強制 → `deleteAllData(db, owner)` → `200 {deleted:true}`。Vercel エントリは `serverContext()` から adapter/db を遅延配線。未認証は withOwner が 401。
- **新規 `api/account/delete.test.ts`**: U-DEL-01（200 + OWNED_TABLES 5 回 delete）/ U-DEL-07（401・削除なし）。

### Phase 2: frontend purge サービス
- **新規 `src/services/auth/selfDelete.ts`**: `purgeAllData({store, ownerId, fetchImpl})` = `DELETE /api/account` を試行（成否を remote フラグへ）→ 成否に関わらず `store.wipeOwner(ownerId)` を実行。offline/keyless でも端末から確実に消える。
- **変更 `src/services/sync/localStore.ts`**: `wipeOwner` を拡張し、entity ストア削除に加え当該 owner の未送信 outbox（payload.ownerId 一致）も除去（削除後の再 push 復活を防止）。
- **新規 `src/services/auth/selfDelete.test.ts`**: U-DEL-02（remote 成功 + wipe）/ U-DEL-08（fetch reject でも local wipe）/ U-DEL-08b（401 でも local wipe）/ U-DEL-06（outbox 残骸ゼロ）。

### Phase 3: AccountPage UI 導線 + App 配線
- **変更 `src/features/account/AccountPage.tsx`**: `onDeleteAllData?` / `onDeleted?` props 追加。`onDeleteAllData` 注入時のみ「データの削除」セクションを表示（二段階確認: 「全データを削除」→ alert + 「削除する」/「キャンセル」）。確定で `onDeleteAllData()` → `onDeleted()`（既定 `window.location.assign("/")` でフレッシュ状態へ）。
- **変更 `src/App.tsx`**: `/account` ルートで repos 確立時に `onDeleteAllData = () => purgeAllData({store, ownerId})` を配線。repos 未確立時は導線非表示（アカウント画面自体は即描画、Loading でブロックしない）。
- **変更 `src/app/repos.ts`**: `Repos` に `store: LocalStore` を公開（wipeOwner 用）。
- **変更 `src/features/account/AccountPage.test.tsx`**: U-DEL-04（確認→削除で onDeleteAllData+onDeleted）/ U-DEL-05（キャンセルで未呼出）/ 未注入時は導線非表示。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | `wipeOwner` の outbox クリア（U-DEL-06 を満たすため。PLAN §1 で言及済み事項を実装） |
| 計画から省略した変更 | `deleteRemote` フラグ引数は省略。purgeAllData は常にサーバ削除を試行し失敗を許容する方式に統一（keyless は 401 → remote=false、ローカルは常に wipe）。分岐が減りシンプル＆堅牢 |
| 想定外の問題と対処 | App.test の `/account` 同期アサートが gate(Loading) で失敗 → `/account` は gate せず即描画し onDeleteAllData のみ repos 依存に変更（UX も改善） |

## PR Description

### タイトル
_shared/auth: O54 セルフサービス全データ削除の UI 導線を実装

### 概要
プラポリ + 利用規約が約束する「アプリ内セルフサービス全データ削除（O54 消去権）」を実際に実行可能にする。本番公開済みアプリの法令ギャップ（約束済みだが履行手段なし）を解消する。

### 変更内容
- `DELETE /api/account`（withOwner → deleteAllData）でサーバ全データ物理削除
- `purgeAllData`（サーバ削除 + ローカル wipe、offline tolerant）
- AccountPage に二段階確認付き「全データを削除」導線
- `wipeOwner` を outbox クリアまで拡張

### テスト
- 単体: 176/176 green（新規 9: API 2 / purge 4 / AccountPage 3）
- typecheck clean
