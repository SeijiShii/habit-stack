# AI_LOG インデックス — habit-stack

**最終更新**: 2026-06-10 (fix C20260610-001)
**総セッション数**: 1
**総 decision 数**: 9

> このフォルダは AI 主導の自走 / 後追いトレースを目的とする詳細ログ。
> セッションごとに 1 ファイル、append-only、過去ファイルは削除・編集禁止。
> 人間向けサマリは `../concept.md` §7 決定事項ログ を参照。

<!-- auto-generated-start -->

## セッション一覧（新しい順）

| ファイル | 実行日 | コマンド | 対象 | decision 範囲 | 状態 |
|---|---|---|---|---|---|
| [D20260610_004_tdd_execution_fix_C20260610-001.md](./D20260610_004_tdd_execution_fix_C20260610-001.md) | 2026-06-10 | /flow:tdd | execution C20260610-001 (fix) | D20260610-019〜021 | 完了 |
| [D20260610_003_resume_continuous.md](./D20260610_003_resume_continuous.md) | 2026-06-10 | /flow:auto | continuous | D20260610-017〜018 | 進行中 |
| [D20260610_002_fix_execution_C20260610-001.md](./D20260610_002_fix_execution_C20260610-001.md) | 2026-06-10 | /flow:fix | execution C20260610-001 | D20260610-009〜016 | 完了→tdd |
| [D20260610_001_claim_execution_C20260610-001.md](./D20260610_001_claim_execution_C20260610-001.md) | 2026-06-10 | /flow:claim | execution C20260610-001 | D20260610-001〜008 | 完了→fix |
| [D20260608_001_concept_initial.md](./D20260608_001_concept_initial.md) | 2026-06-08 | /flow:concept | initial | D20260608-001〜007 | 完了 |

## decision_id 索引（grep 用、新しい順）

| ID | command | phase | chosen (短縮) | type | ファイル |
|---|---|---|---|---|---|
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

## Superseded chain（旧 Open → 新解決）

| 旧 ID | 新 ID | 解決日 | 解決セッション |
|---|---|---|---|
| (なし) | | | |

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
