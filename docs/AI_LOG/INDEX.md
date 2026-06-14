# AI_LOG インデックス — habit-stack

**最終更新**: 2026-06-15 (/flow:revise → spec-review → tdd — _shared/auth R20260615-001 account-switch-stop-sync: 計時停止条件緩和 + 確認 + デバイス⇔アカウント同期ポリシー + データ消失是正。**実装完了 unit 245 green / tsc clean**。spec-review で wipe 配線層を App 層へ是正・P91 追加)
**総セッション数**: 88（表記載は直近のみ。D20260614_006〜011 等は未掲載、`ls docs/AI_LOG/D*.md` 参照）
**総 decision 数**: 157（D20260615-001〜020 を加算。中間セッション分は別 bookkeeping）

> 注: 下の「セッション一覧」表は直近セッションのみ列挙（全 60 件は `ls docs/AI_LOG/D*.md` 参照）。
> AUDIT_20260611_2000 で表の網羅性を Low 指摘済み、再生成は別 bookkeeping。

> このフォルダは AI 主導の自走 / 後追いトレースを目的とする詳細ログ。
> セッションごとに 1 ファイル、append-only、過去ファイルは削除・編集禁止。
> 人間向けサマリは `../concept.md` §7 決定事項ログ を参照。

<!-- auto-generated-start -->

## セッション一覧（新しい順）

| ファイル | 実行日 | コマンド | 対象 | decision 範囲 | 状態 |
|---|---|---|---|---|---|
| [D20260615_006_fix_execution_F20260615-001.md](./D20260615_006_fix_execution_F20260615-001.md) | 2026-06-15 | /flow:fix | execution F20260615-001 (stale-in-progress-badge) | D20260615-028〜031 | 完了（設計、medium、修正計画済） |
| [D20260615_005_e2e__shared_auth_revise_R20260615-001.md](./D20260615_005_e2e__shared_auth_revise_R20260615-001.md) | 2026-06-15 | /flow:e2e | _shared/auth revise R20260615-001 | D20260615-023〜026 | 完了（E2E 24 green） |
| [D20260615_004_resume_continuous.md](./D20260615_004_resume_continuous.md) | 2026-06-15 | /flow:auto | continuous（revise→e2e→fix dispatch） | D20260615-021〜027 | 進行中 |
| [D20260615_003_tdd__shared_auth_revise_R20260615-001.md](./D20260615_003_tdd__shared_auth_revise_R20260615-001.md) | 2026-06-15 | /flow:tdd | _shared/auth revise R20260615-001 (account-switch-stop-sync) | D20260615-017〜020 | 完了（unit 245 green / tsc clean） |
| [D20260615_002_spec-review__shared_auth_R20260615-001.md](./D20260615_002_spec-review__shared_auth_R20260615-001.md) | 2026-06-15 | /flow:spec-review | _shared/auth R20260615-001 (account-switch-stop-sync) | D20260615-009〜016 | 完了（High1/Med2/Low2、P91 追加） |
| [D20260615_001_revise__shared_auth_R20260615-001.md](./D20260615_001_revise__shared_auth_R20260615-001.md) | 2026-06-15 | /flow:revise | _shared/auth R20260615-001 (account-switch-stop-sync) | D20260615-001〜008 | 設計完了（実装待ち） |
| [D20260614_005_revise_streak-summary_R20260614-003.md](./D20260614_005_revise_streak-summary_R20260614-003.md) | 2026-06-14 | /flow:revise | streak-summary R20260614-003 (furikaeri-pagination) | D20260614-019〜021 | 実装完了（unit green） |
| [D20260614_004_revise_execution_R20260614-002.md](./D20260614_004_revise_execution_R20260614-002.md) | 2026-06-14 | /flow:claim→/flow:revise | execution C20260614-001→R20260614-002 (activity-periods) | D20260614-016〜018 | 実装完了（unit green） |
| [D20260614_003_revise_execution_R20260614-001.md](./D20260614_003_revise_execution_R20260614-001.md) | 2026-06-14 | /flow:revise | execution R20260614-001 (running-session-visible-nav) | D20260614-012〜015 | 実装完了（unit green） |
| [D20260613_015_e2e_ui-revise.md](./D20260613_015_e2e_ui-revise.md) | 2026-06-13 | /flow:e2e | UI 改修 3 件 E2E（ヘッダ/ドット/合計時間） | D20260613-055〜057 | 完了（E2E 17/17 green） |
| [D20260613_014_wording_ui.md](./D20260613_014_wording_ui.md) | 2026-06-13 | /flow:wording | UI 改修後の文言校正 | D20260613-053〜054 | 完了（「合計時間」確定） |
| [D20260613_013_design_review.md](./D20260613_013_design_review.md) | 2026-06-13 | /flow:design | UI 改修後の視覚レビュー（ヘッダ縮退） | D20260613-050〜051 | 完了（視覚 green） |
| [D20260613_012_tdd_execution_revise_R20260613-004.md](./D20260613_012_tdd_execution_revise_R20260613-004.md) | 2026-06-13 | /flow:tdd | execution R20260613-004 (set-total-time) | D20260613-047〜049 | 完了（unit 207 green） |
| [D20260613_011_tdd_streak-summary_revise_R20260613-003.md](./D20260613_011_tdd_streak-summary_revise_R20260613-003.md) | 2026-06-13 | /flow:tdd | streak-summary R20260613-003 (remove-dots) | D20260613-044〜046 | 完了（unit 200 green） |
| [D20260613_010_tdd__shared_app-shell_revise_R20260613-002.md](./D20260613_010_tdd__shared_app-shell_revise_R20260613-002.md) | 2026-06-13 | /flow:tdd | _shared/app-shell R20260613-002 (title-logo) | D20260613-041〜043 | 完了（unit 200 green） |
| [D20260613_009_resume_continuous.md](./D20260613_009_resume_continuous.md) | 2026-06-13 | /flow:auto | continuous（UI 改修 3 件実装ドライブ） | D20260613-039〜040, 052 | 完了（Wording gate で pause） |
| [D20260613_008_revise_execution_R20260613-004.md](./D20260613_008_revise_execution_R20260613-004.md) | 2026-06-13 | /flow:revise | execution R20260613-004 (set-total-time) | D20260613-034〜038 | 実装完了（unit green） |
| [D20260613_007_revise_streak-summary_R20260613-003.md](./D20260613_007_revise_streak-summary_R20260613-003.md) | 2026-06-13 | /flow:revise | streak-summary R20260613-003 (remove-dots) | D20260613-030〜033 | 設計完了→spec-review/tdd |
| [D20260613_006_revise__shared_app-shell_R20260613-002.md](./D20260613_006_revise__shared_app-shell_R20260613-002.md) | 2026-06-13 | /flow:revise | _shared/app-shell R20260613-002 (title-logo) | D20260613-026〜029 | 設計完了→spec-review/tdd |
| [D20260613_005_design_streak-summary_review.md](./D20260613_005_design_streak-summary_review.md) | 2026-06-13 | /flow:design | streak-summary 視覚レビュー | D20260613-022〜025 | 完了 |
| [D20260613_004_e2e_streak-summary_revise_R20260613-001.md](./D20260613_004_e2e_streak-summary_revise_R20260613-001.md) | 2026-06-13 | /flow:e2e | streak-summary R20260613-001 (revise) | D20260613-019〜021 | 完了（E2E 12/12 green、新規4） |
| [D20260613_003_tdd_streak-summary_revise_R20260613-001.md](./D20260613_003_tdd_streak-summary_revise_R20260613-001.md) | 2026-06-13 | /flow:tdd | streak-summary R20260613-001 (revise) | D20260613-014〜017 | 完了（197 green、4 Phase） |
| [D20260613_002_resume_continuous.md](./D20260613_002_resume_continuous.md) | 2026-06-13 | /flow:auto | continuous（revise 後 dispatch） | D20260613-012〜013 | 進行中 |
| [D20260613_001_revise_streak-summary_R20260613-001.md](./D20260613_001_revise_streak-summary_R20260613-001.md) | 2026-06-13 | /flow:revise | streak-summary R20260613-001 (振り返り総覧+streak是正) | D20260613-001〜011 | 設計完了→spec-review/tdd |
| [D20260612_002_secure__shared_auth.md](./D20260612_002_secure__shared_auth.md) | 2026-06-12 | /flow:secure | _shared/auth（release-pre 後半） | D20260612-003〜006 | 完了（C0/H0/Info1、O54 充足、prod deps 0 脆弱性） |
| [D20260612_001_resume_continuous.md](./D20260612_001_resume_continuous.md) | 2026-06-12 | /flow:auto | continuous | D20260612-001〜 | 進行中 |
| [D20260611_010_audit_full.md](./D20260611_010_audit_full.md) | 2026-06-11 | /flow:audit | full（release-pre） | D20260611-044 | 完了（C0/H0/L2、Critical解消確認） |
| [D20260611_009_e2e__shared_auth_revise_R20260611-002.md](./D20260611_009_e2e__shared_auth_revise_R20260611-002.md) | 2026-06-11 | /flow:e2e | _shared/auth R20260611-002 (revise) | D20260611-041〜042 | 完了（8/8 E2E green） |
| [D20260611_008_tdd__shared_auth_revise_R20260611-002.md](./D20260611_008_tdd__shared_auth_revise_R20260611-002.md) | 2026-06-11 | /flow:tdd | _shared/auth R20260611-002 (revise) | D20260611-037〜039 | 完了（176 green） |
| [D20260611_007_revise__shared_auth_R20260611-002.md](./D20260611_007_revise__shared_auth_R20260611-002.md) | 2026-06-11 | /flow:revise | _shared/auth R20260611-002 | D20260611-033〜035 | 設計完了→tdd |
| [D20260611_006_audit_standard.md](./D20260611_006_audit_standard.md) | 2026-06-11 | /flow:audit | standard（全体） | D20260611-029〜031 | 完了（Critical 1 / Low 3） |
| [D20260611_005_e2e_execution_revise_R20260611-001.md](./D20260611_005_e2e_execution_revise_R20260611-001.md) | 2026-06-11 | /flow:e2e | execution R20260611-001 (revise) | D20260611-025〜027 | 完了（E2E 6/6 green） |
| [D20260611_004_resume_continuous.md](./D20260611_004_resume_continuous.md) | 2026-06-11 | /flow:auto | continuous | D20260611-023〜043 | 完了（反復6まで、停止是正は D20260612-001） |
| [D20260611_003_tdd_execution_revise_R20260611-001.md](./D20260611_003_tdd_execution_revise_R20260611-001.md) | 2026-06-11 | /flow:tdd | execution R20260611-001 (revise) | D20260611-018〜022 | 完了（167 green） |
| [D20260611_002_spec-review_execution_R20260611-001.md](./D20260611_002_spec-review_execution_R20260611-001.md) | 2026-06-11 | /flow:spec-review | execution R20260611-001 (revise) | D20260611-009〜017 | 完了→tdd |
| [D20260611_001_revise_execution_R20260611-001.md](./D20260611_001_revise_execution_R20260611-001.md) | 2026-06-11 | /flow:revise | execution R20260611-001 (計時永続化・復帰) | D20260611-001〜008 | 設計完了→spec-review |
| [D20260610_009_tdd_execution_revise_R20260610-001.md](./D20260610_009_tdd_execution_revise_R20260610-001.md) | 2026-06-10 | /flow:tdd | execution R20260610-001 (revise) | D20260610-031 | 完了 |
| [D20260610_008_resume_continuous.md](./D20260610_008_resume_continuous.md) | 2026-06-10 | /flow:auto | continuous | D20260610-029〜030 | 進行中 |
| [D20260610_007_revise_execution_R20260610-001.md](./D20260610_007_revise_execution_R20260610-001.md) | 2026-06-10 | /flow:revise | execution R20260610-001 | D20260610-026〜028 | 完了→tdd |
| [D20260610_006_release_habit-stack.md](./D20260610_006_release_habit-stack.md) | 2026-06-10 | /flow:release | habit-stack | D20260610-024〜025 | 完了 |
| [D20260610_005_feedback_execution.md](./D20260610_005_feedback_execution.md) | 2026-06-10 | /flow:feedback | execution (fix C20260610-001) | D20260610-022〜023 | 完了 |
| [D20260610_004_tdd_execution_fix_C20260610-001.md](./D20260610_004_tdd_execution_fix_C20260610-001.md) | 2026-06-10 | /flow:tdd | execution C20260610-001 (fix) | D20260610-019〜021 | 完了 |
| [D20260610_003_resume_continuous.md](./D20260610_003_resume_continuous.md) | 2026-06-10 | /flow:auto | continuous | D20260610-017〜018 | 進行中 |
| [D20260610_002_fix_execution_C20260610-001.md](./D20260610_002_fix_execution_C20260610-001.md) | 2026-06-10 | /flow:fix | execution C20260610-001 | D20260610-009〜016 | 完了→tdd |
| [D20260610_001_claim_execution_C20260610-001.md](./D20260610_001_claim_execution_C20260610-001.md) | 2026-06-10 | /flow:claim | execution C20260610-001 | D20260610-001〜008 | 完了→fix |
| [D20260608_001_concept_initial.md](./D20260608_001_concept_initial.md) | 2026-06-08 | /flow:concept | initial | D20260608-001〜007 | 完了 |

## decision_id 索引（grep 用、新しい順）

| ID | command | phase | chosen (短縮) | type | ファイル |
|---|---|---|---|---|---|
| D20260613-038 | /flow:revise | 付記:Google ログイン調査 | コード/UI/単体は実装済、本番未稼働は OAuth 設定(Class C)未了→/flow:release 領域 | auto-recommended | D20260613_008_revise_execution_R20260613-004.md |
| D20260613-035 | /flow:revise | 合計算出設計 | sessionElapsedSec 純関数を elapsed.ts に追加、formatDuration で表記統一 | auto-recommended | D20260613_008_revise_execution_R20260613-004.md |
| D20260613-034 | /flow:revise | 改修方針(execution) | 計時画面に set-elapsed=全 record 合計（確定+live）を表示 | auto-recommended | D20260613_008_revise_execution_R20260613-004.md |
| D20260613-031 | /flow:revise | dots 削除範囲 | 表示+Summary.dots+AchievementDots/Dot 削除（内部達成判定計算は維持） | auto-recommended | D20260613_007_revise_streak-summary_R20260613-003.md |
| D20260613-030 | /flow:revise | 改修方針(streak) | 達成日ドット（丸）廃止、率バー+連続日数で代替 | auto-recommended | D20260613_007_revise_streak-summary_R20260613-003.md |
| D20260613-027 | /flow:revise | 改修方針(app-shell) | ロゴ+タイトル、狭幅はロゴのみ縮退（CSS、BrandLogo インライン SVG） | auto-recommended | D20260613_006_revise__shared_app-shell_R20260613-002.md |
| D20260613-026 | /flow:revise | 改修構成 | 3 機能（app-shell/streak-summary/execution）それぞれに独立 revise | explicit-choice | D20260613_006_revise__shared_app-shell_R20260613-002.md |
| D20260613-010 | /flow:revise | migration 方式 | execution_record から localDateOf 再導出→upsert+余剰tombstone（冪等） | auto-recommended | D20260613_001_revise_streak-summary_R20260613-001.md |
| D20260613-009 | /flow:revise | 総覧ページ設計 | /summary=ドロップダウン遷移+details折りたたみ+全期間累計時間 | auto-recommended | D20260613_001_revise_streak-summary_R20260613-001.md |
| D20260613-004 | /flow:revise | 根本原因 | streak不正確=localDateのUTC slice（コメントと実装乖離）+today-pending欠落 | auto-recommended | D20260613_001_revise_streak-summary_R20260613-001.md |
| D20260613-001 | /flow:revise | 改修要望 | 3要望（行き止まり/streak/総覧）を1 reviseに束ねる | explicit-choice | D20260613_001_revise_streak-summary_R20260613-001.md |
| D20260611-042 | /flow:e2e | journey 実装 | E-DEL-01/02 ローカルwipe実証、deleteAllDataはunit委譲 | auto-recommended | D20260611_009_e2e__shared_auth_revise_R20260611-002.md |
| D20260611-041 | /flow:e2e | FW 検出 | Playwright 1.60 + Chromium（ローカル headless Class A） | auto-recommended | D20260611_009_e2e__shared_auth_revise_R20260611-002.md |
| D20260611-039 | /flow:tdd | /account 描画 | gate せず即描画、onDeleteAllData のみ repos 依存 | auto-recommended | D20260611_008_tdd__shared_auth_revise_R20260611-002.md |
| D20260611-038 | /flow:tdd | purge 方式 | deleteRemote 廃止、常に試行+失敗許容(local 常時 wipe) | auto-recommended | D20260611_008_tdd__shared_auth_revise_R20260611-002.md |
| D20260611-037 | /flow:tdd | Phase 軽重 | 全3 Phase メイン直接実装 | auto-recommended | D20260611_008_tdd__shared_auth_revise_R20260611-002.md |
| D20260611-035 | /flow:revise | 後方互換/リリース | 純追加・MIGRATION不要・一括 | auto-recommended | D20260611_007_revise__shared_auth_R20260611-002.md |
| D20260611-034 | /flow:revise | サーバ削除方式 | 専用DELETE /api/account + deleteAllData物理削除 | auto-recommended | D20260611_007_revise__shared_auth_R20260611-002.md |
| D20260611-033 | /flow:revise | 改修要望 | O54 セルフ削除UI導線を実装（消去権履行） | auto-recommended | D20260611_007_revise__shared_auth_R20260611-002.md |
| D20260611-031 | /flow:audit | drift shooting | Critical→/flow:revise _shared/auth で削除導線実装 | auto-recommended | D20260611_006_audit_standard.md |
| D20260611-030 | /flow:audit | #4 観点反映 | Critical: O54/O12×O22 セルフ削除UI欠落（約束済・履行不能） | auto-recommended | D20260611_006_audit_standard.md |
| D20260611-029 | /flow:audit | スコープ | standard（#1-#6）、28commits stale 鮮度トリガ | auto-recommended | D20260611_006_audit_standard.md |
| D20260611-027 | /flow:e2e | リグレッション | core-journey 完了文言を できました に追従 | auto-recommended | D20260611_005_e2e_execution_revise_R20260611-001.md |
| D20260611-026 | /flow:e2e | スコープ | リロード/ログイン/サマリ 3本実装、4H/cap/15秒は unit 委譲 | auto-recommended | D20260611_005_e2e_execution_revise_R20260611-001.md |
| D20260611-025 | /flow:e2e | StrictMode 復元バグ | restoredRef 同期gate廃止→appliedRef を async内で立てる（本番致命バグ修正） | auto-recommended | D20260611_005_e2e_execution_revise_R20260611-001.md |
| D20260611-024 | /flow:auto | Step 3 auto-pick | P4.5 E2E gate → /flow:e2e execution R20260611-001 | auto-recommended | D20260611_004_resume_continuous.md |
| D20260611-023 | /flow:auto | Step 0.5 retrospective | 前回=不正停止（pace委譲）→是正して続行 | auto-recommended | D20260611_004_resume_continuous.md |
| D20260611-017 | /flow:spec-review | R8(論点-001解決) | 移送せず + 計時中/account遷移で終了(ログイン限定) | explicit-choice | D20260611_002_spec-review_execution_R20260611-001.md |
| D20260611-016 | /flow:spec-review | Step 5 | 905 生成 + 001/002/003 反映 | auto-recommended | D20260611_002_spec-review_execution_R20260611-001.md |
| D20260611-015 | /flow:spec-review | R7 | 4H cap を表示+確定保存値の双方に | auto-recommended | D20260611_002_spec-review_execution_R20260611-001.md |
| D20260611-014 | /flow:spec-review | R4 | IndexedDB=構造正本 / localStorage=heartbeat+fallback | auto-recommended | D20260611_002_spec-review_execution_R20260611-001.md |
| D20260611-013 | /flow:spec-review | R3 | 自動終了は有効経過>0 item のみ達成算入 | auto-recommended | D20260611_002_spec-review_execution_R20260611-001.md |
| D20260611-012 | /flow:spec-review | R1(P83) | StrictMode 冪等(純関数+put上書き+interval解除) | auto-recommended | D20260611_002_spec-review_execution_R20260611-001.md |
| D20260611-011 | /flow:spec-review | R2 | 15秒flush用にSyncQueueをExecutionPageへ注入 | auto-recommended | D20260611_002_spec-review_execution_R20260611-001.md |
| D20260611-010 | /flow:spec-review | R6 | 復元は found レコードの clientLocalId を採用(日跨ぎ重複防止) | auto-recommended | D20260611_002_spec-review_execution_R20260611-001.md |
| D20260611-008 | /flow:revise | Step 3.1 | 4H: キャップ(R1)と復帰自動終了(R2)を別ルールで両立 | auto-recommended | D20260611_001_revise_execution_R20260611-001.md |
| D20260611-003 | /flow:revise | Step 3.1 substrate | ハイブリッド(IndexedDB維持+毎秒localStorage HB+15秒push+復元配線) | explicit-choice | D20260611_001_revise_execution_R20260611-001.md |
| D20260611-001 | /flow:revise | Step 1.2 | 計時状態の永続化・復帰 + 4H放置キャップ/終了 | explicit-choice | D20260611_001_revise_execution_R20260611-001.md |
| D20260610-016 | /flow:fix | Step 5/7.1 | 修正=表示層限定 / 通常リリース / Postmortem 不要 | auto-recommended | D20260610_002_fix_execution_C20260610-001.md |
| D20260610-015 | /flow:fix | Step 4.1 Why5 | 根本原因: 計時中ライブ表示が SPEC/テスト未カバー | auto-recommended | D20260610_002_fix_execution_C20260610-001.md |
| D20260610-009 | /flow:fix | Step 1.3 | severity=medium | explicit-choice | D20260610_002_fix_execution_C20260610-001.md |
| D20260610-008 | /flow:claim | Step 6 | /flow:fix execution C20260610-001 auto-route | auto-recommended | D20260610_001_claim_execution_C20260610-001.md |
| D20260610-007 | /flow:claim | Step 5 | bug 判定（fix、開始/現在時刻表示も同梱） | explicit-choice | D20260610_001_claim_execution_C20260610-001.md |
| D20260610-006 | /flow:claim | Step 4.3 | 三項照合: Expected=SPEC(now差分)≠Actual(0固定) → bug | auto-recommended | D20260610_001_claim_execution_C20260610-001.md |
| D20260608-009 | /flow:concept | Step 7.7 | git init + commit (69157fb) | auto-recommended | D20260608_001_concept_initial.md |
| D20260608-008 | /flow:concept | Step 3 | Open 論点 001/002/003 登録 | open | D20260608_001_concept_initial.md |
| D20260608-007 | /flow:concept | Q12.5/Q12.6 | 外部AI不使用 / Vercel Web Analytics | auto-recommended | D20260608_001_concept_initial.md |
| D20260608-006 | /flow:concept | Q12.7 | Clerk 匿名ゲスト→段階認証 | auto-recommended | D20260608_001_concept_initial.md |
| D20260608-005 | /flow:concept | Q10/Q11 | time-budget sibling スタック | auto-recommended | D20260608_001_concept_initial.md |
| D20260608-004 | /flow:concept | 設計 | local-first + タイムスタンプ方式 | explicit-choice | D20260608_001_concept_initial.md |
| D20260608-003 | /flow:concept | 設計 | 継続=セット単位・穴あき許容 | explicit-choice | D20260608_001_concept_initial.md |
| D20260608-002 | /flow:concept | Step 1.5 | wants 確定項目 | auto-recommended | D20260608_001_concept_initial.md |
| D20260608-001 | /flow:concept | Step 1.7 | preferences 読込 | auto-recommended | D20260608_001_concept_initial.md |

## Open 論点（chosen_type=open、全期間横断）

| ID | 論点タイトル | 採番セッション | 関連 decision |
|---|---|---|---|
| 論点-001 | ストリーク/継続率の見せ方（罪悪感回避） | D20260608_001 | D20260608-003 |
| 論点-002 | 公開ドメイン（サブドメ）確定 | D20260608_001 | — |
| 論点-003 | feedback-hub 連携（共有シークレット） | D20260608_001 | — |
| R20260611-001/論点-001 | 計時中の guest→Clerk リンク時の進行中セッション扱い（推奨: 移送せず guest で完了） | D20260611_001 | D20260611-003 |

## Superseded chain（旧 Open → 新解決）

| 旧 ID | 新 ID | 解決日 | 解決セッション |
|---|---|---|---|
| (なし) | | | |

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
