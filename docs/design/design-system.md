# habit-stack デザインシステム (SoT)

**生成元**: /flow:design (--system-only)
**最終更新**: 2026-06-08
**コンセプト由来**: docs/concept.md（提供価値 / ターゲット / §12.13 デザイン方向）
**方向確定**: 穏やか・積み上げ（D20260608-015、ユーザー承認）
**参照観点**: perspectives O34（視覚検証）/ O38（コピー no-jargon）/ O39（design-from-concept）/ O41（入口の「これは何？」）/ O43（価格透明性）/ O55（ルート到達性）/ O56（ブランドマーク）

> 本ファイルがデザインの単一情報源。画面は生値でなくトークンを参照する。視覚レビュー（Step 4）は画面実装後に `/flow:design --review-only` で実施。

---

## 1. デザイン原則（コンセプト → 視覚の翻訳）

1. **コツコツの安心感** — 「続けたい良い習慣を積み上げる」を、落ち着いた成長色（sage/teal）と紙のような暖かい背景で表現。派手な祝祭でなく静かな前進。
2. **罪悪感を残さない**（charter §2.2） — 穴あき日（一部未実行）も「達成」。途切れを赤く咎めない。色とコピーで「やれた」を静かに肯定し、未達は淡く中立に。
3. **手応えは控えめに祝う** — 達成のアクセントは温かい amber を「点」で使う。連続記録は🔥演出でなく穏やかなハイライト止まり。
4. **数字が主役** — 経過時間・継続率・達成日数が読みやすいこと最優先。中立サンセリフ + 等幅寄りの数字表示。
5. **実行に集中** — 実行画面は操作（開始/終了/一時停止/再開）が迷わず押せる。装飾より操作の明快さ。
6. **静かなトーン** — 競争・ランキング・煽りを視覚的にも作らない（charter §2.2）。

## 2. カラートークン

| トークン | 値 | 用途 |
|---|---|---|
| `--color-bg` | #FAF8F3 | アプリ背景（暖かいオフホワイト＝紙） |
| `--color-surface` | #FFFFFF | カード・面 |
| `--color-surface-sunken` | #F2EFE8 | 入力背景・沈んだ面 |
| `--color-text` | #2A2E2C | 本文（やや緑寄りの濃灰） |
| `--color-text-muted` | #6B716E | 補助テキスト・未達日 |
| `--color-border` | #E3DFD6 | 境界 |
| `--color-primary` | #3F7A6E | 主色（成長・継続。CTA / 進行中） |
| `--color-primary-hover` | #356558 | 主色ホバー |
| `--color-primary-subtle` | #E4EFEC | 主色の淡い面（選択中セット等） |
| `--color-accent` | #E8A23D | アクセント（達成の手応え。点で使う） |
| `--color-accent-subtle` | #FBEFD9 | 達成日ハイライトの淡い面 |
| `--color-success` | #4F9D6E | 完了・成功（控えめ） |
| `--color-warning` | #C9892F | 注意（無料枠アラート等） |
| `--color-danger` | #B5524A | 破壊操作（削除確認のみ。未達には使わない） |

> **未達日に danger を使わない**（原則 2）。未達は `--color-text-muted` / 空ドットで中立表現。

### ダークモード（v2 検討、トークン名は維持）
bg=#1A1E1C / surface=#23282 6 / primary を明度上げ。MVP は light のみ。

## 3. タイポグラフィ

| 役割 | フォント | サイズ/行間 |
|---|---|---|
| 本文 | Inter / system-ui | 16/1.6 |
| 見出し | Inter（600） | 20-28/1.3 |
| 数字（時間/継続率） | Inter `tabular-nums` | 桁揃え、やや大きめ |
| キャプション | Inter | 13/1.5、muted |

- Web フォント: Inter（可変フォント、self-host 推奨で外部依存最小）。fallback = system-ui。

## 4. 形・影・余白

- **角丸**: `--radius-sm`=8px / `--radius-md`=12px / `--radius-lg`=16px（カード）/ pill=999px（チップ・主ボタン）
- **影**: `--shadow-sm`=0 1px 2px rgba(0,0,0,.05) / `--shadow-md`=0 2px 8px rgba(0,0,0,.06)。控えめ。
- **余白スケール**: 4 / 8 / 12 / 16 / 24 / 32 / 48（`--space-1`〜`--space-7`）

## 5. コンポーネント（基本形）

- **Button**: primary（塗り、pill）/ secondary（surface + border）/ ghost（テキスト）/ danger（削除確認のみ）。最小タップ 44px。
- **Card**: surface + radius-lg + shadow-sm。活動セット・アイテムカード。
- **Chip**: 時間帯（朝/昼/夕/夜）を pill で。選択中は primary-subtle。
- **Input / Textarea**: surface-sunken 背景、focus で primary border。今日メモは短文 textarea。
- **TimerControl**: 大きな主ボタン（開始/一時停止/再開/次へ）。進行中は primary、一時停止中は accent 縁取り。
- **AchievementDot**: 達成日=accent-subtle 塗り + accent 点 / 未達=border の空ドット（咎めない）。
- **StreakBar / RateGauge**: 継続率を穏やかなバー/ゲージで（Recharts）。
- **入口の「これは何？」導線（O41）**: トップにリード文「続けたい習慣を時間で記録して、続けられているかを穏やかに振り返るアプリ」を常設。収まらない場合は丸付き「?」インフォボタン + 軽量モーダル。
- **TipJarButton（O43）**: 「💛」絵文字でなく自作 SVG ハート。文言は「100円で作者を応援」と**金額を CTA 前に明示**。非ブロッキング。

## 6. ボイス & コピー（O38 準拠）

- **トーン**: 励ますが押し付けない。穏やかで前向き。一人称はユーザー寄り。
- **NG（罪悪感・煽り・技術用語）→ 言い換え**:
  - 「連続記録が途切れました」→（使わない。淡く「今日はまだ」程度）
  - 「サボった / 失敗」→ 使わない
  - 「同期エラー / API failed」→「あとで自動で保存します」
  - 「セッション / レコード / エンティティ」→「実行 / 記録」
  - 「ログイン必須」→「他の端末でも見たいときは Google でつなげます」
- **エラー方針**: 原因の技術詳細を出さず、ユーザーの次の一手を示す。オフラインは不安にさせない（「ネットがなくても記録できます」）。
- **達成表現**: 「やれた」「今日もひとつ」。連続は「◯日つづいています」止まり（煽らない）。
- **仕上げ**: 固さ除去は `/flow:wording`（O42 対話校正 + JA→EN 整合）で実施。

## 7. アイコン & イラスト & ブランドマーク

- **アイコン**: OSS アイコンセット（lucide 等、line 系でテーマ色追従）。**絵文字は UI に使わない**（環境依存で崩れる）。
- **イラスト**: 自作 SVG line-art（積み上がるブロック / 芽が育つ / チェックの軌跡）。空状態・継続サマリのヒーローに。テーマ色（primary/accent）追従。
- **ブランドマーク（PWA 必須、O56）**: 単一 SVG ソース（積み上げを示すシンプルな図 = 重なるブロック or 上向きの芽、sage/teal + amber 点）から派生:
  - `public/favicon.svg`（ソース）/ `favicon.ico` / `apple-touch-icon.png`(180²) / `icon-192.png` / `icon-512.png` / `icon-maskable-512.png` / `manifest.json` icons + `index.html` head wiring。
  - 生成: `scripts/gen-favicon.js`（sharp + to-ico）→ `npm run gen:favicon`。**絵文字 favicon NG**。
  - ※ 実生成は Step 3 適用フェーズ（スタイル基盤導入時）で実施。

## 8. レビュー基準（Step 4 視覚レビュー用、画面実装後）

- 階層・余白がトークン準拠か / 数字（時間・継続率）が一番読みやすいか
- 未達日が「失敗」に見えていないか（原則 2）
- accent（amber）が点使いで、達成の手応えとして機能しているか
- 入口で初見の人がサービスの正体を言えるか（O41）
- tip-jar で金額が CTA 前に明示か（O43）
- 全 route に inbound link があるか（O55、特に /legal/*）
- 体感遅延画面（同期待ち等）で素のスピナーでなく穏やかな進捗表現か（O45）
- ユーザー向け文字列に技術用語・絵文字アイコンがないか（O38）

---

## 適用状況

- [x] Step 3 スタイル基盤適用（2026-06-09）— `src/styles/theme.css` にトークン + 要素セレクタ基盤 + ユーティリティ class（`.btn-primary`）を実装。セマンティック HTML 中心の構成に合わせ要素セレクタで全画面に適用（header/nav/footer/main/section/form/input/button/カード行/dl 等）。CSS 1.17kB→7.57kB。
- [x] Step 4 視覚レビュー（2026-06-09）— headless スクショ（mobile 390px）で HomePage / 法務（特商法）を確認 = 穏やか・積み上げの世界観が適用済み（teal ブランド header / primary CTA / 紙背景 / muted 補助テキスト / dl グリッド）。`/sets` 等は guest セッション要のため preview では Loading 表示（auth/env 制約、styling 欠陥ではない）。

> **経緯（CF-20260609-006）**: 当初 `--system-only` で SoT のみ生成し「状態=完了」と記録したため、適用（Step 3）+ 視覚レビュー（Step 4）が deferred のまま feature→tdd→e2e→release を通過し、コンポーネントが素の HTML（className 0）で公開された（claim C20260609-001）。本セッションで Step 3/4 を実施して解消。flow 側も design セッションを SoT-only で「完了」にしない修正済み。
