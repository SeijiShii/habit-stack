# 実装レポート: _shared/legal

## 実装日時
2026-06-08 19:02 (JST)

## モード
feature

## 関連ドキュメント
- 001-003 + 905 + [AI_LOG](../../AI_LOG/D20260608_022_tdd__shared_legal.md)

## 変更一覧
- `src/features/legal/content.ts`: プラポリ/利用規約/特商法の文面（データ分離、差し替え容易）。**O54 ゲスト削除文言**（運営側で特定不能 → アプリ内セルフサービス削除、窓口削除を約束しない）を含む。
- `src/features/legal/LegalPages.tsx`: PrivacyPage / TermsPage / SctPage（セマンティック HTML）。
- `src/components/LegalFooter.tsx`: 3 法務リンク常設フッタ（O55 到達性）。

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 追加 | なし |
| 後続 | consent 記録（Google リンク時の同意タイムスタンプ）は app-shell の Clerk 認証配線時。特商法の販売者情報は事業形態確定後に差し替え（雛形） |
| 問題と対処 | なし |

## PR Description
### タイトル
_shared/legal: 法務公開ページ（プラポリ/利用規約/特商法）+ O54/O55
### 概要
公開 + tip-jar に必須の法務ページ。ゲスト=セルフサービス削除（O54）、フッタ常設導線（O55）。
### テスト
5 テスト（必須法務項目 text assert + O54 文言 + O55 リンク）。累計 61/61 green。
