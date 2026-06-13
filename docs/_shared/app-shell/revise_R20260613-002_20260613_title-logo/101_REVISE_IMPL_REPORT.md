# 実装レポート: _shared/app-shell R20260613-002（タイトル左ロゴ + 幅不足時ロゴのみ）

## 実装日時
2026-06-13 17:38 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md] - 変更仕様書
- [002_REVISE_PLAN.md] - 変更計画書
- [003_REVISE_UNIT_TEST.md] - 単体テスト計画
- [AI_LOG セッション](../../../AI_LOG/D20260613_006_revise__shared_app-shell_R20260613-002.md)

## 注意事項
本レポートのファイルパス・行番号は実装日時時点のもの。

## 変更一覧

### Phase 1: BrandLogo コンポーネント（軽・メイン直接）
- 新規 `src/components/BrandLogo.tsx` — favicon.svg と同じ「積み上がるブロック + 達成の点」モチーフのインライン SVG。`size` prop（既定 20）、装飾要素のため `aria-hidden="true"` + `focusable="false"`、配色は design トークン（`--color-primary` / `--color-accent`）を CSS 変数で参照。
- 新規 `src/components/BrandLogo.test.tsx` — U1（SVG 描画）/ U2（size 反映）/ U6（aria-hidden）。

### Phase 2: AppLayout 配線 + 縮退 CSS（軽・メイン直接）
- `src/components/AppLayout.tsx` — nav 先頭ホームリンクを `<Link to="/" className="brand-link" aria-label="つみあげルーティン（ホーム）"><BrandLogo/><span className="brand-name">つみあげルーティン</span></Link>` に変更。`BrandLogo` を import。
- `src/styles/theme.css` — `.brand-link`（inline-flex + gap + primary 色 + nowrap）/ `.brand-name`（overflow ellipsis）/ `.brand-logo`（flex 0 0 auto）を追加。`nav[aria-label="メイン"]` に `container-type: inline-size`、`@container (max-width: 360px)` で `.brand-name { display:none }`（= 狭幅でロゴのみ）。container query 非対応環境向けに `@supports not` + `@media (max-width: 380px)` フォールバックを併設。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし |
| 計画から省略した変更 | `App.test.tsx` の修正（M1 計画）は不要だった。既存テストはアプリ名を h1 heading / href で参照しており nav リンクのテキスト一致に依存していなかったため、span 維持で無改修のまま green |
| 想定外の問題と対処 | なし |

## PR Description

### タイトル
_shared/app-shell: アプリタイトル左にロゴ、狭幅でロゴのみ縮退（R20260613-002）

### 概要
ヘッダのアプリ名が狭幅でエリプシスになる問題を解消。タイトル左にブランドロゴ（favicon モチーフ）を追加し、ヘッダ幅が狭いときは CSS container query でアプリ名を隠してロゴのみ表示する。アプリ名はリンクの aria-label で支援技術に保持。

### 変更内容
- `BrandLogo` コンポーネント新規（インライン SVG、design トークン配色、aria-hidden）
- `AppLayout` ホームリンクをロゴ + タイトル span に変更、aria-label 付与
- `theme.css` に brand スタイル + 狭幅縮退（container query + media fallback）

### テスト
- 新規 BrandLogo 単体 3 件 green、App 既存 7 件 green、全体 200/200 green、typecheck clean
