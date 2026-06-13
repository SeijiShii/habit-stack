# D20260614_002_release_habit-stack

**実行日時**: 2026-06-14 08:45 (+09:00)
**コマンド**: /flow:release（/flow:auto P4.7 Release gate から dispatch）
**対象**: habit-stack 本番デプロイ
**実行者**: Claude (opus-4-8) + seiji
**状態**: 完了

## metrics

- deploy_target: production
- deployed_url: https://habit-stack.givers.work
- check_result: post-deploy smoke green（/ 200, /summary 200, /api/health 200, /api/sync/pull 401）
- collected_vars: なし（live 化済、env カバレッジ完全）
- paid_confirmed: N/A（課金経路への変更なし）

## 主要決定サマリ

| decision | 内容 |
|---|---|
| D20260614-006 | §1.0 live 化判定: `.env.production.local` に sk_live_ (Clerk/Stripe) → live 化済。test→live swap skip |
| D20260614-007 | §1.0c ケース ii（live PJ 改修）: ユーザー選択 = prod 直行（footer+ふりかえり、表示系・テスト緑）。Phase 2 ローカル確認は post-deploy smoke に統合 |
| D20260614-008 | §3.3 Class B 明示確認 → ユーザー承認（デプロイ + GitHub push） |
| D20260614-009 | git push origin main（3 commits）+ deploy-prod.sh 実行（関数数 8/12 OK）→ READY、aliased habit-stack.givers.work |
| D20260614-010 | post-deploy smoke green。footer CSS 修正のデプロイ反映確認 |
| D20260614-011 | promote skip: 新規 launch でなく既公開アプリの改修デプロイ（告知やり直し不要） |

## 依存関係

- depends_on: D20260614-002〜005（release-pre full audit クリア）

## 生成・更新アーティファクト

- 本番デプロイ（dpl_4L9xgDPBirK2TZ82Qw3qdJGnjsrh）
- git push origin main（c65b03c / afff039 / 332c9b2）
- docs/AI_LOG/D20260614_002_release_habit-stack.md（本ファイル）

## Decisions

```yaml
- id: D20260614-006
  timestamp: 2026-06-14T08:45:00+09:00
  command: /flow:release
  phase: Phase 1 §1.0
  question: live 化状態の判定
  chosen: live 化済（.env.production.local の sk_live_ Clerk/Stripe を実 read）
  chosen_type: auto-recommended
  context: SoT① .env.production.local prefix

- id: D20260614-007
  timestamp: 2026-06-14T08:45:00+09:00
  command: /flow:release
  phase: §1.0c ケース ii
  question: live PJ 改修の preview-first vs prod-direct
  chosen: prod 直行（ユーザーが上流で「今デプロイ」を選択、表示系・217 unit green）
  chosen_type: explicit-choice
  context: footer CSS 修正 + ふりかえり再設計、API/課金/認証/データ変更なし

- id: D20260614-008
  timestamp: 2026-06-14T08:46:00+09:00
  command: /flow:release
  phase: Phase 3 §3.3
  question: Class B デプロイ明示確認
  chosen: 承認（デプロイ + GitHub push）
  chosen_type: explicit-choice
  context: 本番 prod、live キー稼働、課金経路変更なし

- id: D20260614-010
  timestamp: 2026-06-14T08:48:00+09:00
  command: /flow:release
  phase: Phase 3 §3.4
  question: post-deploy smoke
  chosen: green（/ 200, /summary 200, /api/health 200, /api/sync/pull 401, footer CSS 反映）
  chosen_type: auto-recommended
  context: O51 関数起動 OK、O22 認証ゲート OK

- id: D20260614-011
  timestamp: 2026-06-14T08:48:00+09:00
  command: /flow:release
  phase: Step 4.5 #5
  question: promote 告知文生成の要否
  chosen: skip（既公開アプリの改修デプロイ、新規 launch でない）
  chosen_type: auto-recommended
  context: habit-stack は既に public・告知済。footer/ふりかえり改善は告知やり直し不要
```

## 学習・改善

なし。release-pre audit → prod 直行 → post-deploy smoke の標準フローを完遂。
