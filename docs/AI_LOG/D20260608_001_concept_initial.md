# AI_LOG セッション D20260608_001 — /flow:concept (initial)

**実行日時**: 2026-06-08 16:00 〜 16:15 (+09:00)
**コマンド**: /flow:concept
**対象**: プロジェクト全体（初版作成、habit-stack）
**実行者**: Claude (Opus 4.8) + seiji
**状態**: 完了
**含まれる decision**: D20260608-001 〜 D20260608-009 (9 件)
**ファイル**: `D20260608_001_concept_initial.md`

---

## 主要決定サマリ

| ID | テーマ | 採用 | type |
|---|---|---|---|
| D20260608-003 | 継続の定義 | セット単位・穴あき許容（1 アイテム以上実行で達成） | explicit-choice |
| D20260608-004 | 実行/同期 | local-first + タイムスタンプ方式（IndexedDB → Neon） | explicit-choice |
| D20260608-005 | スタック | time-budget sibling（Neon/Clerk/Vercel/Drizzle/shadcn/Stripe） | auto-recommended |
| D20260608-006 | 認証 | Clerk 匿名ゲスト → 段階認証（O22） | auto-recommended |
| D20260608-007 | AI / アナリティクス | 外部 AI 不使用 / Vercel Web Analytics(cookieless) | auto-recommended |

## 依存関係

- D20260608-002 → [D20260608-001]
- D20260608-004 → [D20260608-003]（継続定義が達成日集計に影響）
- D20260608-005 → [D20260608-001]（preferences 6 PJ 選好）
- 外部依存: time-budget concept（sibling、知見流用、別 PJ root）

## 生成・更新したアーティファクト

- 新規: `docs/concept.md`（§1〜§12）
- 新規: `docs/INDEX.md`, `docs/DOC_MAP.md`, `docs/PREREQUISITES.md`, `docs/SCENARIO.md`
- 新規: 機能 5 + 横断 6 フォルダの README.md + INDEX.md
- 新規: `README.md`（ルート）
- 新規: `docs/AI_LOG/INDEX.md`
- 更新: `docs/wants.md`（クリア）

## 学習・改善

- 観点拡張なし（既存 perspectives で充足）。time-budget sibling パターンの再確認。
- preferences: time-budget と同型のため強い選好スタックを再採用（採用回数 +1 候補は Step 7.5 で確認）。

---

## Decisions

```yaml
- id: D20260608-001
  timestamp: 2026-06-08T16:00:00+09:00
  command: /flow:concept
  phase: Step 1.7 / preferences.md 読込
  question: preferences.md 読込結果サマリ
  options:
    - 読込成功
  recommended: 読込成功
  chosen: 学習元 7 PJ / 強い選好(6+): React+TS・Vercel Functions・Neon・Clerk・Drizzle・Vercel Hobby・Sentry・GitHub Actions CI・shadcn/ui。傾向(3-5): Stripe単発・Vercel Web Analytics・Vercel Cron。habit-stack は time-budget の sibling 構成
  chosen_type: auto-recommended
  depends_on: []
  context: |
    preferences.md 最終更新 2026-05-29、学習元 7 PJ。
    §3.1 個人ツール/無料枠厳守スタック (charter §0 Neon スタック) が本 PJ に直適合。
    wants.md の技術スタック仮説と完全一致。
- id: D20260608-002
  timestamp: 2026-06-08T16:00:00+09:00
  command: /flow:concept
  phase: Step 1.5 / wants 取り込み
  question: wants.md の確定済み項目 (name/users/problem/UC/monetization/stack)
  options:
    - wants 記載どおり確定
  recommended: wants 記載どおり確定
  chosen: プロダクト名=つみあげルーティン(habit-stack) / ユーザー=良い習慣を続けたい個人(匿名既定) / 課題=習慣継続の手応え可視化 / 主要UC 6件 / 収益=tip-jar-fallback(完全無料+100円投げ銭) / スタック= time-budget sibling
  chosen_type: auto-recommended
  depends_on: [D20260608-001]
  context: |
    wants.md が極めて高充足。Q1-Q4/Q10/Q11/収益/社会善は wants で確認形式に変換、
    残る Class C は「継続の定義」「タイマー処理」「オフライン要件」「ストリークUX」。
- id: D20260608-003
  timestamp: 2026-06-08T16:05:00+09:00
  command: /flow:concept
  phase: Step 2 / 継続の定義
  question: 「継続」の判定単位と継続率の算出をどう定義するか
  options:
    - アイテム単位を主軸 (recommended)
    - セット単位
    - 時間帯単位
  recommended: アイテム単位を主軸
  chosen: セット単位だが穴あき許容（セット内 1 アイテム以上実行でその日は達成）
  chosen_type: explicit-choice
  depends_on: []
  context: |
    AI 推奨はアイテム単位だったが、seiji が「セット単位だが穴あきがあっても達成とする」を明示。
    all-or-nothing 回避（charter §2.2）を満たしつつセット粒度で判定。
    継続率 = 達成日数/対象日数。セット完遂率は補助指標。§5.1 daily_achievement に反映。
- id: D20260608-004
  timestamp: 2026-06-08T16:08:00+09:00
  command: /flow:concept
  phase: Step 2 / 実行・同期設計
  question: 時間ベース実行とオフライン動作の設計方針
  options:
    - ローカルファースト + タイムスタンプ方式 (recommended)
    - オンラインファースト（サーバ保存主体）
  recommended: ローカルファースト + タイムスタンプ方式
  chosen: ローカルファースト + タイムスタンプ方式（IndexedDB 匿名 → Google リンク時 Neon 同期）
  chosen_type: explicit-choice
  depends_on: [D20260608-003]
  context: |
    タイマーを生で回さず開始タイムスタンプ差分で経過算出 → バックグラウンド/スリープ/タブ閉じでも正確。
    匿名は IndexedDB に local-first、認証時に同期キューで Neon へ upsert（last-write-wins）。§4 §5.2 に反映。
- id: D20260608-005
  timestamp: 2026-06-08T16:10:00+09:00
  command: /flow:concept
  phase: Step 2 / Q10-Q11 技術・リソース選定
  question: 技術スタックとリソース選定
  options:
    - time-budget sibling スタック (recommended)
  recommended: time-budget sibling スタック
  chosen: Vite+React+TS PWA / Vercel Functions / Neon / Drizzle / Clerk / shadcn/ui / TanStack Query / Recharts / Stripe(単発) / Sentry / Vercel Web Analytics / Vercel Hobby / GitHub Actions
  chosen_type: auto-recommended
  depends_on: [D20260608-001]
  context: |
    preferences 強い選好（6 PJ）+ wants 技術スタック仮説 + time-budget 同型。charter §0 Neon スタック無料枠厳守。
- id: D20260608-006
  timestamp: 2026-06-08T16:11:00+09:00
  command: /flow:concept
  phase: Step 2 / Q12.7 認証
  question: 認証方式
  options:
    - Clerk 匿名ゲスト → 段階認証 (recommended)
    - 最初から OAuth 強制
  recommended: Clerk 匿名ゲスト → 段階認証
  chosen: Clerk 匿名ゲスト → Google 段階認証（課金時必須）、パスキーは v2
  chosen_type: auto-recommended
  depends_on: [D20260608-005]
  context: |
    O22 認証摩擦最小化。初回 0 タップ実行、デバイス連携/課金時のみ Google リンク + ローカルデータ引き継ぎ。
- id: D20260608-007
  timestamp: 2026-06-08T16:12:00+09:00
  command: /flow:concept
  phase: Step 2 / Q12.5 Q12.6
  question: 外部 AI とアナリティクスの採否
  options:
    - 外部AI不使用 + Vercel Web Analytics (recommended)
  recommended: 外部AI不使用 + Vercel Web Analytics
  chosen: 外部 AI 使わない（記録・集計が主）/ Vercel Web Analytics（cookieless、consent banner 不要）
  chosen_type: auto-recommended
  depends_on: []
  context: |
    AI の差別化価値が薄く MVP 外。cookieless アナリティクスで GDPR/個情法でも banner 省略可。§6 §4.3 に反映。
- id: D20260608-008
  timestamp: 2026-06-08T16:14:00+09:00
  command: /flow:concept
  phase: Step 3 / 論点抽出
  question: 未決論点の登録
  options:
    - 論点-001/002/003 を §8 登録
  recommended: 登録
  chosen: 論点-001(ストリークUX), 論点-002(ドメイン), 論点-003(feedback-hub)
  chosen_type: open
  depends_on: [D20260608-003]
  context: |
    セキュリティ論点(owner-check/Zod/PII scrub/レート制限/webhook 署名)は /flow:secure --phase=design で SEC-NNN 登録予定。
- id: D20260608-009
  timestamp: 2026-06-08T16:16:00+09:00
  command: /flow:concept
  phase: Step 7.7 / Git 自動コミット
  question: ドキュメント生成物の自動コミット
  options:
    - git init + commit (recommended)
    - commit しない
  recommended: git init + commit
  chosen: git init + 1 commit (69157fb, branch=main, staged 32 files, .env 不混入確認済, push なし)
  chosen_type: auto-recommended
  depends_on: []
  context: |
    NEW モード・git 未初期化 → ユーザー承認で git init。concept.md §10 auto_commit=true。
    `docs(flow:concept): initial — habit-stack 概念設計`。push はユーザー手動。
```
