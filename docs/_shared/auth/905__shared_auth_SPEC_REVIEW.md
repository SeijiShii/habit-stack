<!-- auto-generated-start -->
# 設計レビューレポート — _shared/auth

**レビュー日**: 2026-06-08 / **実施**: Claude (Opus 4.8) / **モード**: auto-pick
**入力**: 001-003 + concept §1.1/§3.X / **観点**: 組み込み + P1-P82
**前提**: greenfield（実コードなし）→ 設計整合 + セキュリティ責務中心。

## 1. サマリー
| 観点 | 評価 | 備考 |
|---|---|---|
| 権限・認可 | OK | owner resolver でサーバ強制（SEC-001、P10 表示/編集分離は単一ユーザー自己データで N/A） |
| 既存パターン | N/A | greenfield |
| 責務逸脱 | OK | 認証/認可 + owner 解決 + ゲスト移行 + 削除に限定 |
| テストカバレッジ | OK | 401/403/200 + 匿名→authed(P4.46) + PII マスク |

## 2. 指摘事項
### [R1] 匿名→authed 経路の実コード検証を tdd 完了条件に固定 (severity=High, P4.46 連動)
- **問題**: stub auth（固定 owner 注入）が green でも本番セッション未実装を隠すリスク（過去 PJ 再発）。
- **推奨**: tdd で「匿名サインイン → 保護 API 200（401 でない）」を**実セッション経路**で検証する（N5 を必須化）。Clerk scaffold を展開。
- **chosen**: 003 N5 を必須・本番経路要件として明示済み（feature 設計で対応済み）。確認のみ。
- **反映先**: 003（既存記載で充足）。

### [R2] [論点-009] ゲスト→アカウント owner 統合方式 (severity=Medium)
- **推奨**: 実装着手時に Clerk anonymous 永続化アップグレード可否を確認 → 案A（同一 id）優先、不可なら案B（mergeGuestData 付け替え）。
- **chosen**: tdd Phase 3 で確定（open 維持）。

## 3. コードベース調査
- greenfield。Critical なし、High 1（P4.46 連動、設計で対応済み確認）。

## 4. 設計判断ログ
| # | 判断 | 結論 | type |
|---|---|---|---|
| R1 | 匿名→authed 実検証 | tdd 完了条件に固定 | auto-recommended |
| R2 | ゲスト移行方式 | tdd で確定（open） | open |

## 5. 次のステップ: `/flow:tdd _shared/auth`（db 後）。Clerk scaffold 展開、P4.46 検証必須。
<!-- auto-generated-end -->
