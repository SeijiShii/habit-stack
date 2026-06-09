# クレーム判定レポート

**claim id**: C20260609-001
**判定日**: 2026-06-09
**判定者**: Claude (Opus 4.8) + seiji
**判定**: バグ（実装漏れ） → 美的remediation のため **/flow:design** へ誘導（claim 原則 #1）

## 1. 三項照合

### 1.1 期待 (Expected)
design-system.md の世界観が画面に適用されている（§5 Button=primary 塗り pill / Card=surface+radius-lg+shadow / Input=surface-sunken、トークンによる色・余白・タイポ）。

### 1.2 既存仕様 (Spec)
- `docs/design/design-system.md §5 コンポーネント`: Button / Card / Input を定義。
- `docs/design/design-system.md` 行112: `- [ ] Step 3 スタイル基盤適用（トークン → テーマ / 基本コンポーネント / ブランドマーク scaffold）— 実装フェーズで実施` = **未チェック（未完）**。
- SCENARIO Phase 1.5（デザイン）+ Phase 3 の Design gate（P4.4 視覚レビュー green）= スタイル適用済みが完了要件。

### 1.3 現実 (Actual)
- `src/styles/theme.css`: CSS 変数（トークン）+ 要素セレクタ `body` / `button` / `main` / `.num` のみ（計1.17kB）。
- コンポーネント: `className` 使用 **0 箇所**（全 .tsx）、inline `style={` は `src/features/streak-summary/components.tsx` のみ。
- 例: `src/pages/HomePage.tsx` は `<main><h1><p><Link></main>` の素のセマンティック HTML。`<Link>` は既定リンク（青下線）で主ボタン化されていない。
- = design-system §5 のコンポーネント（カード/主ボタン/Input）が**未実装**。

### 1.4 照合結果
期待 = SPEC 記載（design-system §5 + Step 3 適用）≠ 現実（未適用、Step 3 チェックボックス未完）→ **実装漏れバグ**。Design gate（P4.4(b) 視覚レビュー）が実質未実施だったため公開まで見逃された。

## 2. 判定根拠
1. design-system.md という SoT が存在し、適用すべき仕様（§5）が明確 → SPEC 不在/曖昧ではない（feature/revise ではない）。
2. 実装が SPEC に反している（コンポーネントがトークン/コンポーネント定義を適用していない）→ バグ（実装漏れ）。
3. design-system.md 行112 のチェックボックスが未完 = 「スタイル基盤適用（Step 3）」工程そのものが飛ばされている（局所バグでなく工程漏れ）。
4. remediation は「design-system をコンポーネントへ適用 + 視覚レビュー」= **美的/視覚判断を伴う**。claim 原則 #1 によりこの種の remediation は claim 内で実装・確定せず **/flow:design へ誘導**する（narrow な /flow:fix ではなく、視覚レビューを持つ design コマンドが適切）。

## 3. 推奨分岐先
- **コマンド**: `/flow:design`（スタイル基盤適用 Step 3 + headless 視覚レビュー）
- 理由: design-system.md の Step 3 未完を埋め、各画面を headless スクショで視覚レビューして「素のまま」を検出・修正する責務が design コマンドにある（P4.4 Design gate の本来の実行）。
- /flow:fix ではない: 局所バグでなく「デザイン基盤適用工程の未実施」+ 美的判断を伴うため。

## 4-5. 却下/保留
該当なし。

## 6. 関連
- クレーム原文: `./000_CLAIM_REPORT.md`
- デザイン SoT: `../../../design/design-system.md`（行112 Step 3 未完）
- プロセス含意: Design gate（P4.4(b) 視覚レビュー）が実質未実施で公開された（再発防止は別途）。
