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
- 現在フェーズ: Phase 5 (公開後運用) — **未デプロイ改修なし**。fix C20260617-001 (token-stale-owner-churn = 認証トークン失効→リロードで新ゲスト userId 発行→getAllByOwner orphan でデータ消失。bousai guest 自前署名 JWT 機構を移植し Clerk 非セッション化で根治) を **2026-06-17 本番反映済**（GUEST_TOKEN_SECRET prod 設定 + deploy + smoke green）。残: 実機スマホで reload-persistence 目視 + 既存残の 100円 live tip B-4（いずれも Class C）
- 進行中ターゲット: なし（C20260617-001 デプロイ完了で改修キュー空）
- 公開 URL: **https://habit-stack.givers.work**（live、Clerk prod verified / Neon prod / Stripe live）
- 直近デプロイ (2026-06-16): **C20260616-001 set-data-loss-after-login fix** を本番反映（破壊的 wipe→非破壊 reassignOwnerLocal、smoke green、commit 124adc2）。それ以前: R20260611-001 計時永続化 + R20260611-002 セルフ削除 (2026-06-12, prod-direct, Build Output API, smoke green)
- ⚠️ データ消失 2 段ロケット: ① C20260616-001 = ログイン直後の set 消失（破壊的 wipe）を非破壊 reassign で修正・**デプロイ済** ② C20260617-001 = トークン失効後リロードでの silent owner churn（別機序）を guest 自前署名 JWT 永続化で根治・**未デプロイ**
- guest-auth 機構刷新 (C20260617-001 Phase1-6): Clerk ticket ゲスト → **自前署名 guest JWT (signGuestToken/verifyGuestToken) + localStorage 永続 (GUEST_TOKEN_KEY) + 複合 owner resolver**。`GUEST_TOKEN_SECRET` env 追加（.env.example 記載済、本番 env 設定が release 残作業）
- デザイン: design-system 適用済 (00dddf5)・視覚レビュー green（2026-06-13 総覧画面含む再レビュー）
- audit/secure: **AUDIT_20260617_1426 (full, C0/H0/M0, release-pre) + SECURITY_REVIEW_20260617 (L1, C0/H0)** — O22(D) owner churn step 3.9 = PASS、guest-JWT 機構 design-clean。release-pre クリア済
- 直近デプロイ (2026-06-17): **C20260617-001 guest-auth fix 本番反映**（GUEST_TOKEN_SECRET prod 設定、deploy --prebuilt --prod、dpl_2zHMF2E3kxfhGz82uyXJq8rGxiAd）。smoke: / 200 / health 200 / **guest EP 200 (iss=habit-stack-guest, sub=guest_*)** / sync 401
- promote: 告知文ドラフト生成済 (docs/marketing/、投稿は手動) / wording: 校正済 (24527d5)
- 最終更新セッション: D20260617_004_resume_continuous → D20260617_009_release_habit-stack
- 最終更新時刻: 2026-06-17 14:36
- 完了フェーズ: [Phase 1 概念設計, Phase 1.5 デザイン, Phase 2 機能設計(全11), Phase 2.5 spec-review(全11), Phase 3 実装(全11), Phase 3.5 E2E, release-pre audit/secure, **Phase 4 本番デプロイ(計時永続化+セルフ削除+C20260616-001 データ消失 fix 含む)**]
- Phase 3 実装: **全11 target + revise R20260610/0611-001/002 + R20260613-001 + fix C20260616-001 + fix C20260617-001 実装完了**
  - 累計 272 unit green、typecheck green、vite build 成功
  - SEC-001〜005 実装で充足、SEC-DEP High closed/Critical accepted-risk(dev-only)
- 次の推奨: **P5 完了評価** — C20260617-001 デプロイ + smoke green で改修キュー空。残作業は実機スマホ目視（reload-persistence の最終確認）+ 既存残の 100円 live tip B-4（いずれも Class C 本人確認）のみ
- Open 論点: 論点-002(ドメイン=サブドメ確定済 givers.work)、論点-003/010(feedback-hub)、論点-009(Clerk確認時)、論点-011(vitest accepted-risk)
<!-- AUTO-GENERATED:END scenario-cursor -->

## 6. 変更履歴

- 2026-06-17: /flow:release で C20260617-001 guest-auth fix を本番反映 — GUEST_TOKEN_SECRET prod 設定 + deploy --prebuilt --prod + smoke green (guest EP 200)。§5 を「未デプロイ改修なし / 改修キュー空」に更新 (decision_id=D20260617-021〜025、/flow:auto P4.7 Release gate 由来)
- 2026-06-17: /flow:scenario --update で §5 を HEAD 同期 — C20260616-001 データ消失 fix デプロイ済 + C20260617-001 guest-auth 書換 (owner churn 根治) 実装済・未デプロイ を反映 (decision_id=D20260617-018、/flow:auto §3.0c drift シューティング由来)
- 2026-06-08: /flow:concept で初回生成
