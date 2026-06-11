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
- 現在フェーズ: Phase 4 (公開準備) — **未デプロイ改修2件を本番反映済**、残=実機 B-4 (100円 live tip) 確認のみ
- 進行中ターゲット: なし（release 完了）→ 次 P5 完了評価（残は Class C/B-4 のみ）
- 公開 URL: **https://habit-stack.givers.work**（live、Clerk prod verified / Neon prod / Stripe live）
- 直近デプロイ (2026-06-12): R20260611-001 計時永続化 + R20260611-002 セルフ削除を本番反映。prod-direct、Build Output API、**8関数**、smoke 5/5 green
- ⚠️ release 中に本番バグ検出・修正 (C20260612): DELETE /api/account が 405 (ルート不整合 api/account/delete.ts→実ルート/api/account/delete、クライアントは/api/account を呼ぶ) = サーバ自己削除が本番未実行だった → api/account.ts 移設 + メソッドガード + 回帰 U-DEL-10 + smoke 恒久追加で修正 (e33434f)、再デプロイ後 401 で解消
- スモーク (2026-06-12): / 200 / health 200 / guest 200 (Clerk prod) / sync 401 / **DELETE /api/account 401** (O54 消去権が本番で履行可能に回復)
- デザイン: design-system 適用済 (00dddf5)・視覚レビュー green・本番反映済
- audit/secure: AUDIT_20260611_2025 (full, C0/H0/L2) + SECURITY_REVIEW _shared/auth (D20260612_002, C0/H0, O54 充足) = release-pre クリア
- promote: 告知文ドラフト生成済 (docs/marketing/、投稿は手動) / wording: 校正済 (24527d5) / 残: 実機 B-4 (100円 live tip) 確認のみ
- 最終更新セッション: D20260612_001_resume_continuous → D20260612_003_release
- 最終更新時刻: 2026-06-12 09:05
- 完了フェーズ: [Phase 1 概念設計, Phase 1.5 デザイン, Phase 2 機能設計(全11), Phase 2.5 spec-review(全11), Phase 3 実装(全11), Phase 3.5 E2E, release-pre audit/secure, **Phase 4 本番デプロイ(計時永続化+セルフ削除 含む)**]
- Phase 3 実装: **全11 target + revise R20260610/0611-001/002 実装完了**
  - 累計 177 unit + 8 E2E green、typecheck green、vite build 成功、release-pre audit/secure pass
  - SEC-001〜005 実装で充足、SEC-DEP High closed/Critical accepted-risk(dev-only)
- 次の推奨: **P5 完了評価** — 残作業は実機 B-4 (100円 live tip、Class C 本人実課金確認) のみ。それ以外 (デプロイ/サブドメ/wording/promote 生成/audit/secure) は完了
- Open 論点: 論点-002(ドメイン=サブドメ確定済 givers.work)、論点-003/010(feedback-hub)、論点-009(Clerk確認時)、論点-011(vitest accepted-risk)
<!-- AUTO-GENERATED:END scenario-cursor -->

## 6. 変更履歴

- 2026-06-08: /flow:concept で初回生成
