# 単体テストレポート: _shared/auth R20260611-002（セルフサービス全データ削除）

## 実施日時
2026-06-11 20:14 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md] — 単体テスト計画

## テスト実行環境
- ランタイム: Node (vitest run)
- フレームワーク: Vitest + fake-indexeddb/auto + happy-dom（UI）

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| U-DEL-01 | 認証済み owner で deleteAllData 実行 + 200 | api/account/delete.test.ts | ✅ | OWNED_TABLES 5 回 delete |
| U-DEL-07 | 未認証 401・削除なし | api/account/delete.test.ts | ✅ | withOwner ガード |
| U-DEL-02 | remote 成功時 wipe + DELETE 呼び出し | src/services/auth/selfDelete.test.ts | ✅ | |
| U-DEL-08 | fetch reject でも local wipe、remote=false | src/services/auth/selfDelete.test.ts | ✅ | offline-critical |
| U-DEL-08b | 401 でも local wipe、remote=false | src/services/auth/selfDelete.test.ts | ✅ | keyless ゲスト |
| U-DEL-06 | wipeOwner が owner の outbox 残骸も消す | src/services/auth/selfDelete.test.ts | ✅ | 再 push 復活防止 |
| U-DEL-04 | 確認→「削除する」で onDeleteAllData+onDeleted | src/features/account/AccountPage.test.tsx | ✅ | 二段階確認 |
| U-DEL-05 | 「キャンセル」で onDeleteAllData 未呼出 | src/features/account/AccountPage.test.tsx | ✅ | 誤削除防止 |
| （追加） | 未注入時は削除導線非表示 | src/features/account/AccountPage.test.tsx | ✅ | |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| U-DEL-08b | purgeAllData | 401（非 2xx）でもローカル wipe | keyless ゲストの実挙動（サーバにデータ無し）を明示 |
| — | AccountPage | onDeleteAllData 未注入時の導線非表示 | repos 未確立時のガード挙動を固定 |

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数 | 7 |
| 追加テスト数 | 2 |
| 合計（本改修分） | 9 |
| 成功 | 176 / 176（全体）|
| 失敗 | 0 |
| 成功率 | 100% |

## リグレッション
- 既存 167 テスト維持（AccountPage 既存 4 状態・コアジャーニー不変）。
- typecheck clean。
