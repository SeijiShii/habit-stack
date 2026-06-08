# プロダクトドキュメントマップ (habit-stack / つみあげルーティン)

**最終更新**: 2026-06-08 16:10 (+09:00)
**最新コマンド**: /flow:concept (D20260608_001_concept_initial)
**統計**: 機能フォルダ 5 / 横断フォルダ 6 / 改修件数 0 / バグ修正件数 0 / クレーム判定件数 0 / Open 論点 3 件

> **このファイルは AI 用エントリポイント**。目的別に「どこから読めばいいか」「次に何を Read すべきか」を示す。

<!-- auto-generated-start -->

## 0. AI 用クイックアクセス（目的別）

| 目的 | 最初に Read | 次に Read | 注記 |
|---|---|---|---|
| プロダクト全体を理解する | `./concept.md` (§1, §1.3, §4.2) | `./INDEX.md` | 5 分で全体像 |
| 次に何をすべきか判断する | `./SCENARIO.md` (§5 現在地カーソル) | `./AI_LOG/INDEX.md` | `/flow:auto` 起動で三点照合 |
| 特定機能を理解する | `./<feature>/README.md` | `./<feature>/INDEX.md` → `001_*_SPEC.md` | feature 一覧は §2 |
| 設計判断の経緯を辿る | `./AI_LOG/INDEX.md` | 該当セッションファイル | decision_id 索引で grep |
| 未決論点を見る | `./concept.md §8` | `./AI_LOG/INDEX.md` Open 論点 | 同期されている |
| 実装前準備を確認 | `./PREREQUISITES.md` | `./concept.md §4.3 §6 §9` | API キー / 法務 |
| 工数感を知る | `./estimates/` | 機能別 estimate | `/flow:estimate` で生成 |
| 法務書類対応状況 | `./concept.md §9` | `./_shared/legal/` | 公開 + tip-jar で必須 |

## 1. プロダクト全体

- **概念設計 (SoT)**: [./concept.md](./concept.md)
  - 一行で言うと: 続けたい良い習慣を活動セットとして時間ベースで実行・記録し継続を可視化
  - 現フェーズ: 企画（concept 初版）
  - 最終更新: 2026-06-08
- **プロジェクト INDEX (フラット一覧)**: [./INDEX.md](./INDEX.md)
- **実装前準備**: [./PREREQUISITES.md](./PREREQUISITES.md)
- **見積もり**: [./estimates/](./estimates/)

## 2. 機能フォルダ（業務ドメイン）

| 優先度 | 基盤 | フォルダ | 状態 | INDEX |
|---|---|---|---|---|
| 3 | ❌ | activity-sets | 未設計 | [INDEX](./activity-sets/INDEX.md) |
| 4 | ✅ | execution | 未設計 | [INDEX](./execution/INDEX.md) |
| 4 | ❌ | feedback | 未設計 | [INDEX](./feedback/INDEX.md) |
| 5 | ❌ | streak-summary | 未設計 | [INDEX](./streak-summary/INDEX.md) |
| 5 | ❌ | tip-jar | 未設計 | [INDEX](./tip-jar/INDEX.md) |

## 3. 横断フォルダ（_shared/*）

| 優先度 | フォルダ | 状態 | INDEX |
|---|---|---|---|
| 1 | _shared/db | 未設計 | [INDEX](./_shared/db/INDEX.md) |
| 1 | _shared/types | 未設計 | [INDEX](./_shared/types/INDEX.md) |
| 2 | _shared/auth | 未設計 | [INDEX](./_shared/auth/INDEX.md) |
| 2 | _shared/local-sync | 未設計 | [INDEX](./_shared/local-sync/INDEX.md) |
| 2 | _shared/legal | 未設計 | [INDEX](./_shared/legal/INDEX.md) |
| 最後 | _shared/app-shell | 未設計 | [INDEX](./_shared/app-shell/INDEX.md) |

## 4. 設計判断の経緯

- **AI_LOG インデックス**: [./AI_LOG/INDEX.md](./AI_LOG/INDEX.md)
- **最新セッション**: D20260608_001_concept_initial（concept 初版、decision D20260608-001〜007）
- **Open 論点**: 3 件（concept §8 と同期）
- **Superseded chain**: 0 件

## 5. 観点・選好データ（PJ 外部参照）

- **観点 SoT**: `~/.claude/flow-data/perspectives.md`
- **開発者選好**: `~/.claude/flow-data/preferences.md`（学習元 7 PJ、本 PJ は time-budget sibling）
  - 強い選好: React+TS / Vercel Functions / Neon / Clerk / Drizzle / Vercel Hobby / Sentry / GitHub Actions / shadcn/ui

## 6. ファイル種別ガイド（番号体系）

| 種別 | 番号 / パターン | パス例 | 生成元 |
|---|---|---|---|
| 機能 SPEC | `001_*_SPEC.md` | `./<feature>/001_<feature>_SPEC.md` | `/flow:feature` |
| 機能 PLAN | `002_*_PLAN.md` | `./<feature>/002_<feature>_PLAN.md` | `/flow:feature` |
| 単体テスト計画 | `003_*_UNIT_TEST.md` | `./<feature>/003_*_UNIT_TEST.md` | `/flow:feature` |
| E2E テスト計画 | `004_*_E2E_TEST.md` | `./<feature>/004_*_E2E_TEST.md` | `/flow:feature` |
| 実装レポート | `101_*_IMPL_REPORT.md` | `./<feature>/101_*_IMPL_REPORT.md` | `/flow:tdd` |
| AI_LOG セッション | `D<date>_<sess>_<cmd>_<target>.md` | `./AI_LOG/D20260608_001_concept_initial.md` | 各 flow コマンド |

## 7. 依存・優先度グラフ（concept §1.3.4 から導出）

```
_shared/db (優先度1, 基盤✅)
_shared/types (優先度1, 基盤✅)
_shared/auth (優先度2, 基盤✅) ← db
_shared/local-sync (優先度2, 基盤✅) ← db, types
_shared/legal (優先度2)
activity-sets (優先度3) ← db, auth, local-sync
execution (優先度4, 基盤✅) ← activity-sets, local-sync, db, auth
feedback (優先度4) ← auth
streak-summary (優先度5) ← execution, db
tip-jar (優先度5) ← auth, db
_shared/app-shell (優先度最後, O57) ← 全部
```

循環依存: なし

## 8. コマンド使い分けガイド

| やりたいこと | コマンド | 入力 | 主要出力 |
|---|---|---|---|
| 概念設計 | `/flow:concept` | wants ファイル | `./concept.md` + 各 INDEX + AI_LOG |
| 工数見積もり | `/flow:estimate` | concept.md | estimate ファイル |
| デザインシステム | `/flow:design` | concept.md | `docs/design/design-system.md` |
| 新規機能を設計 | `/flow:feature <feature>` | concept + README | `001_SPEC` 〜 `004_E2E_TEST` |
| 設計レビュー | `/flow:spec-review` | 設計 4 文書 | `905_SPEC_REVIEW` |
| TDD 実装 | `/flow:tdd` | 設計文書 | `101` + `102` |
| 自動進行 | `/flow:auto` | SCENARIO + AI_LOG | next-step 自動実行 |

## 9. 履歴サマリ

- **改修件数 (累計)**: 0 件
- **バグ修正件数 (累計)**: 0 件
- **クレーム判定件数 (累計)**: 0 件

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
