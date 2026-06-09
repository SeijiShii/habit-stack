# つみあげルーティン (habit-stack) 開発シナリオ

**最終更新**: 2026-06-08 16:10
**生成元**: /flow:concept (初回) / /flow:scenario (更新)
**シナリオ種別**: 新規 MVP 立ち上げ（UI を持つ PWA、公開予定あり）

> 本ファイルは AI が「次に何をすべきか」を判断する際の参照ドキュメント。
> `/flow:auto` および引数空起動された各 flow コマンドが本ファイルを Read する。
> §5 現在地カーソルは flow コマンドが auto-generated 範囲で書き換える。

---

## 1. ゴール

続けたい良い習慣を活動セットとして時間ベースで実行・記録し、罪悪感を煽らない継続の手応えを可視化する PWA を、無料枠厳守で MVP → 公開する。

## 2. 進行フェーズ

1. **Phase 1: 概念設計** — concept.md + SCENARIO.md 確定
2. **Phase 1.5: デザインシステム** — concept から design SoT 導出 + スタイル基盤適用（`/flow:design`、O39）
3. **Phase 2: 機能設計** — concept §1.3 優先度順に SPEC + PLAN + UNIT_TEST + E2E_TEST 生成
4. **Phase 3: 実装** — TDD で各機能を実装。画面実装後に視覚デザインレビュー（Design gate）
5. **Phase 4: 公開準備** — audit + secure(deps) + 法務書類 + PR
6. **Phase 5: 公開後運用** — claim / fix / revise の循環

## 3. 各フェーズで使う flow コマンド + 完了ゲート

### Phase 1: 概念設計
- 主: `/flow:concept`（初回 ✅ 完了）
- セキュア: `/flow:secure --phase=design --scope=concept`
- 見積（1 回目）: `/flow:estimate`
- 完了ゲート: concept.md 全節、secure Critical/High closed、initial 見積生成

### Phase 1.5: デザインシステム
- 主: `/flow:design`
- 完了ゲート: `docs/design/design-system.md` 生成、トークンがスタイル基盤に反映

### Phase 2: 機能設計
- 主: `/flow:feature <target>`（優先度順: _shared/db → types → auth/local-sync/legal → activity-sets → execution/feedback → streak-summary/tip-jar → app-shell）
- レビュー: `/flow:spec-review`
- セキュア: `/flow:secure --phase=design --scope=feature_<target>`
- 完了ゲート: 全機能の 001〜004 生成、Critical/High 解決

### Phase 3: 実装
- 主: `/flow:tdd`（unit）+ `/flow:e2e`（E2E）
- セキュア: `/flow:secure --phase=pre-impl` / `--phase=deps`
- 完了ゲート: 全機能 101 + 102、全テスト green、Phase 単位コミット

### Phase 4: 公開準備
- 主: `/flow:audit` + `/flow:secure --phase=deps` + `/flow:design --review-only`
- 法務: `_shared/legal` 実装 + 公開ページ
- リリース: `/flow:release`（env FILL → ローカルスマホ動作確認 → デプロイ）
- 完了ゲート: PR マージ + 本番デプロイ

### Phase 5: 公開後運用 (循環)
- バグ/クレーム → `/flow:claim` → `/flow:fix` or `/flow:revise` → `/flow:tdd` → PR

## 4. 分岐ルール

| イベント | 切替先 | 戻り先 |
|---|---|---|
| Critical/High SEC finding | `/flow:revise` or `/flow:fix` | 元 Phase |
| ユーザークレーム | `/flow:claim` | 判定先 |
| 設計 drift（audit） | `/flow:revise` | 元 Phase |
| 依存 Critical CVE | `/flow:fix` | 元 Phase |

## 5. 現在地カーソル

<!-- AUTO-GENERATED:BEGIN scenario-cursor -->
- 現在フェーズ: Phase 4 (公開準備) — **本番デプロイ済**、残=実機/課金スモーク + promote
- 進行中ターゲット: /flow:release（デプロイ完了、post-deploy スモーク green）→ 次 P4.8 promote
- 公開 URL: **https://habit-stack.givers.work**（live、Clerk prod verified / Neon prod / Stripe live）
- デプロイ: prod-direct、Build Output API (Node↔Web adapter)、7関数、smoke: health/guest 200・auth gate 401
- デザイン: design-system 適用済 (00dddf5、theme.css 7.57kB)・視覚レビュー green・本番反映済 (claim C20260609-001 解決)
- 本番修正: c7ad9f7 (Web handler adapter) / a10a386 (Clerk guest createUser 識別子 CF-016) / d6333b3 (CLERK_PUBLISHABLE_KEY) / 00dddf5 (design 適用)
- 最終更新セッション: D20260609_001_resume_continuous
- 最終更新時刻: 2026-06-09 14:18
- 完了フェーズ: [Phase 1 概念設計, Phase 1.5 デザイン, Phase 2 機能設計(全11), Phase 2.5 spec-review(全11), Phase 3 実装(全11), Phase 3.5 E2E(コアジャーニー), release-pre audit/secure]
- Phase 3 実装: **全11 target 実装完了**（db/types/auth/local-sync/legal/activity-sets/execution/feedback/streak-summary/tip-jar/app-shell）
  - 累計 116/116 テスト green、typecheck green、**vite build 成功（デプロイ可能 O57）**、E2E コアジャーニー 3/3 green、release-pre audit pass
  - SEC-001〜005 実装で充足、SEC-DEP High closed/Critical accepted-risk(dev-only)
- 次の推奨コマンド: **/flow:release**（P4.7）— 実キー FILL（Clerk/Neon/Stripe、env-acquisition-guide）→ ローカルスマホ動作確認（課金系含む）→ デプロイ（Class B）。**実キーは人間しか持たない = Class C 1問1答**
- Release 後: サブドメ確定(論点-002) → /flow:promote(告知文) → P5
- Open 論点: 論点-002(ドメイン=Release)、論点-003/010(feedback-hub)、論点-009(Clerk確認時)、論点-011(vitest accepted-risk)
<!-- AUTO-GENERATED:END scenario-cursor -->

## 6. 変更履歴

- 2026-06-08: /flow:concept で初回生成
