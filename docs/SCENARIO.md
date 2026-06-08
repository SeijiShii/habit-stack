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
- 現在フェーズ: Phase 1 (概念設計)
- 進行中ターゲット: concept (初版生成完了)
- 最終更新セッション: D20260608_001_concept_initial
- 最終更新時刻: 2026-06-08 16:10
- 完了フェーズ: []
- 次の推奨コマンド: /flow:secure --phase=design --scope=concept（Phase 1 完了ゲート）、続いて /flow:estimate（初回見積）→ /flow:design（Phase 1.5）
<!-- AUTO-GENERATED:END scenario-cursor -->

## 6. 変更履歴

- 2026-06-08: /flow:concept で初回生成
