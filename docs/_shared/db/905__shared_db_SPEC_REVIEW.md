<!-- auto-generated-start -->
# 設計レビューレポート — _shared/db

**レビュー日**: 2026-06-08
**レビュー実施者**: Claude (Opus 4.8)
**対象**: _shared/db（DB スキーマ横断基盤）
**入力**: 001_SPEC + 002_PLAN + 003_UNIT_TEST + concept.md §5.1 / §3.X SEC
**観点ソース**: 組み込みチェックリスト + review-perspectives.md (P1-P82)
**モード**: auto-pick
**severity-threshold**: low
**前提**: greenfield（実装コード未作成）→ 影響範囲・既存呼び出し元・既存パターン整合は N/A。設計内部整合・依存完全性・設計判断を主眼にレビュー。

## 1. レビューサマリー

| 観点 | 評価 | 備考 |
|---|---|---|
| 仕様の明確性 | OK | 6 テーブル + 2 enum + index/unique 明示 |
| 既存パターンとの一貫性 | N/A | greenfield（本基盤が最初のパターン定義元） |
| API 設計 | OK | Drizzle クエリビルダ、生 SQL 禁止方針 |
| エラーハンドリング | OK | FK/unique/owner 不一致を §4 で定義 |
| テストカバレッジ | OK | 型テスト + 制約/index assert（003） |
| 影響範囲・副作用 | N/A | 新規基盤 |
| API 流用・責務逸脱 | OK | スキーマ定義に限定 |
| 既存実装の再利用 | OK | users テーブルを作らず owner_id 直保持（P19: 過剰新設を回避） |
| データ移行・互換性 | OK | 前方向マイグレーションのみ、破壊的変更は別レビュー |
| 権限・認可 | OK | アプリ層 owner resolver（SEC-001、RLS 不使用は明示判断 D20260608-019） |

## 2. 指摘事項（severity 降順）

### [R1] daily_achievements の正本/キャッシュ位置づけ (severity=Medium, P5/P20)
- **対象**: 001 §3.2 daily_achievements / §8
- **現状**: 「キャッシュ（再計算可能）」と注記。
- **問題**: 読み（streak-summary）と書き（execution）のデータソースが分散。キャッシュなら再計算ロジックの所在を明確化すべき（P5: 読み書きソース一致）。
- **推奨**: **キャッシュ方針を維持**。execution が実行確定時に upsert、streak-summary は本テーブルを読む。daily_achievements が破損/欠落しても execution_records から再計算可能とする（再計算は streak-summary の summarize に副次実装）。正本は execution_records。
- **種別**: 設計判断項目
- **chosen**: キャッシュ（正本=execution_records、再計算可能）
- **chosen 根拠**: 継続率の高速集計のためキャッシュは有用。正本を records にすることで整合崩れを復旧可能。
- **反映先**: 001 §3.2 / §8 に R1 コメント付与。

### [R2] deleted_at tombstone の参照除外の一貫性 (severity=Low, P20)
- **対象**: 001 §3.2 全テーブル
- **現状**: deleted_at で論理削除 + 同期 tombstone。
- **推奨**: 全 read クエリで `deleted_at IS NULL` を一貫適用（owner resolver or repo 層で標準化）。同期 pull は tombstone を含めて配信。
- **種別**: 指摘事項（自動反映）
- **chosen**: repo 層で deleted_at フィルタを標準化、同期層は tombstone 配信
- **反映先**: 002 PLAN リスク注記に追記（R2）。

### [R3] client_local_id の unique スコープ (severity=Info)
- **対象**: 001 §3.2 execution_sessions/records
- **現状**: unique(owner_id, client_local_id)。
- **評価**: 匿名→認証で owner_id が変わる場合、同一 client_local_id が新 owner で再 upsert される可能性。mergeGuestData（_shared/auth）が owner 付け替えを行うため整合は取れる。問題なし（Info）。

## 3. コードベース調査結果
- greenfield のため実コードなし。本基盤が最初のスキーマ定義。既存呼び出し元 0、影響範囲 N/A。
- P19（新規前に既存確認）: users テーブルを新設せず owner_id 直保持 = 過剰定義回避を確認。

## 4. 設計判断ログ
| # | 判断項目 | 結論 | chosen_type | 反映先 |
|---|---|---|---|---|
| R1 | daily_achievements 正本/キャッシュ | キャッシュ（正本=records、再計算可能） | auto-recommended | 001 §3.2/§8 |
| R2 | tombstone 参照除外の一貫性 | repo 層で標準化 | auto-recommended | 002 |

## 5. 次のステップ
- 反映済み 001/002 を確認。
- `/flow:tdd _shared/db` で実装着手（greenfield、最優先基盤）。
<!-- auto-generated-end -->
