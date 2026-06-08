# 実装レポート: feedback

## 実装日時
2026-06-08 19:16 (JST)

## モード
feature

## 関連ドキュメント
- 001-004 + 905 + [AI_LOG](../AI_LOG/D20260608_025_tdd_feedback.md)

## 変更一覧
- `model/piiScrub.ts`: 送信前 PII 除去（メール/電話/位置、SEC-004 法令）+ scrubObject（ネスト）。
- `model/feedbackClient.ts`: 自動コンテキスト付与 → scrub → hub 送信。失敗 degrade。
- `FeedbackWidget.tsx`: 1 タップ起動 + 好き嫌い + 自由記述 + お礼（O40）。
- `api/feedback.ts`: hub 中継（env 未設定で 202 degrade、[論点-010]）。

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 追加 | なし |
| 後続 | 運用者即時通知チャンネル配線 / hub 実接続（[論点-010] hub 構築後）。レート制限は app-shell で配線 |
| 問題と対処 | full-run で 1 回 transient flake → 3 回再実行で安定 95/95 確認 |

## PR Description
### タイトル
feedback: 好き嫌い+バグ報告ウィジェット（PII scrub/hub 中継 O40）
### 概要
どの画面からも 1 タップでフィードバック。送信前 PII scrub（SEC-004）、hub 二重シンク、degrade。
### テスト
8 テスト（piiScrub 4 / client 2 / widget 1 / api 1）。累計 95/95 green、typecheck green。
