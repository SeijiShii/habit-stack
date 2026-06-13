# 実装レポート: _shared/app-shell R20260613-005（「他のアプリ」back-link 導線）

## 実装日時
2026-06-13 19:05 (JST)

## モード
revise

## 関連ドキュメント
- 001_REVISE_SPEC / 002_REVISE_PLAN / 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST
- [AI_LOG](../../../AI_LOG/D20260613_021_tdd__shared_app-shell_revise_R20260613-005.md)

## 変更一覧

### Phase 1: footer に「他のアプリ」back-link（軽・メイン直接）
- 新規 `src/config/showcase.ts` — `SHOWCASE_URL = "https://givers.work"`（1 箇所集約、ドメイン変更耐性）。
- `src/components/LegalFooter.tsx` — footer に `aria-label="ほかのサービス"` の nav を追加し「他のアプリ」リンク（`href=SHOWCASE_URL`, `target="_blank"`, `rel="noopener noreferrer"`）。既存法務リンクは `aria-label="法務情報"` の inner nav に整理、footer 自体の aria-label を「フッター」に変更。
- 新規 `src/components/LegalFooter.test.tsx` — U1-U4（リンク href/target/rel + 法務 3 リンク残存）。

## 実装計画からの差分
| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | footer aria-label を「法務情報」→「フッター」に変更（法務 + 他のアプリの 2 nav を内包するため。App.test は textContent 基準で非依存、無改修 green） |
| 計画から省略 | なし |
| 想定外の問題 | なし |

## PR Description
### タイトル
_shared/app-shell: footer に「他のアプリ」back-link（shipyard / givers.work 誘導、O62）

### 概要
公開マイクロサービス相互送客（O62）として footer に「他のアプリ」リンクを追加し showcase（givers.work）へ誘導。URL は設定定数に集約。

### 変更内容
- `SHOWCASE_URL` 定数新規
- `LegalFooter` に「他のアプリ」外部リンク追加（noopener）
- 単体 2 件追加

### テスト
- 全体 209/209 green、typecheck clean
