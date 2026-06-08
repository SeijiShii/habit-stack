# feedback 実装計画書

> **入力**: `./001_feedback_SPEC.md`, perspectives O40
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧（src/features/feedback/）

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `FeedbackWidget.tsx` | グローバルボタン + モーダル（リアクション/記述/スクショ） | design | 140 |
| `model/piiScrub.ts` | 送信前 PII 除去（メール/位置/本文パターン） | — | 80 |
| `model/feedbackClient.ts` | hub 送信 + 再送キュー + 自動コンテキスト | piiScrub, types | 110 |
| `api/feedback.ts` | hub への中継（or 直送）+ 運用者通知 + レート制限 | auth | 90 |

## 2. 実装 Phase 分割
### Phase 1: piiScrub（純関数）
- メール/位置/電話/本文 PII を除去。テスト: 各 PII パターンの scrub（SEC-004）。
### Phase 2: feedbackClient + 自動コンテキスト
- context 付与 → scrub → 送信。再送キュー。テスト: scrub 後送信、失敗時キュー。
### Phase 3: FeedbackWidget（UI）
- 1 タップ起動、リアクション/記述/スクショ。design トークン。
### Phase 4: api/feedback（中継 + 通知 + レート制限）
- hub endpoint へ中継、運用者通知、レート制限（O27）。env 未設定時 degrade。

## 3. 依存関係順序
```
piiScrub → feedbackClient → FeedbackWidget(UI) / api/feedback(中継)
依存: _shared/auth, design-system, (外部)feedback-hub
```

## 4. 既存ファイルへの影響
- app-shell がグローバルに FeedbackWidget 配置。

## 5. 横断フォルダへの追加・変更
- なし。

## 6. リスク・注意点
- **PII scrub の網羅性**（SEC-004 法令）。スクショのメタ/写り込みは注意（MVP はスクショ任意 + 警告）。
- hub 未構築時の degrade（[論点-010]）。
- スパム対策（O27、Turnstile/レート制限）。

## 7. 完了の定義
- [ ] piiScrub + client + widget + api 実装
- [ ] 単体 green（PII scrub 網羅、送信/再送）
- [ ] hub 未設定時 degrade 動作
- [ ] E2E（004）：ウィジェット起動→送信→ありがとう表示
- [ ] design 適用

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
