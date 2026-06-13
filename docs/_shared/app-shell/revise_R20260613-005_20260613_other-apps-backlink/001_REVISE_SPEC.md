# _shared/app-shell 変更仕様書（「他のアプリ」back-link 導線）

> **改修種別**: 機能拡張（導線追加）
> **issue / slug**: R20260613-005 / other-apps-backlink
> **基準 SPEC**: `../001__shared_app-shell_SPEC.md`
> **最終更新**: 2026-06-13
> **タグ**: i18n（固定文言）、analytics（流入導線、計測は任意）

---

## 1. 変更概要

公開マイクロサービス群の相互送客（perspectives O62）として、全ページ常設の footer に「**他のアプリ**」リンクを追加し、showcase サイト **givers.work（shipyard）** へ誘導する。showcase → 各サービスの送客（O48 / 一覧）と対をなす、各サービス → showcase の逆向き送客。showcase URL は設定定数 1 箇所に集約してドメイン変更に追従する。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 姉妹サービス発見 | 導線なし（他のアプリへ辿れない） | footer の「他のアプリ」リンクから givers.work へ | O62 相互送客、O55 導線とセット |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `LegalFooter`（footer） | 法務リンク 3 つのみ | 法務リンク + 「他のアプリ」リンク（外部、`target="_blank" rel="noopener noreferrer"`） | 互換（追加のみ） |
| 新規 `SHOWCASE_URL` 定数 | なし | `https://givers.work` を設定定数 1 箇所に集約 | 新規 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| （なし） | UI のみ | 不要 |

### 2.4 バリデーション・エラー変更
変更なし。

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| `LegalFooter.tsx`（or footer 区画） | 中 | 「他のアプリ」リンク追加（直接対象） |
| 新規 showcase URL 定数 | 低 | 1 箇所集約 |
| 既存 footer テスト | 低 | 追加リンクの存在テスト |

## 4. 後方互換性
- **互換維持**: ✅（導線追加のみ、既存リンク・データに影響なし）

## 5. ロールバック方針
- **コード revert で戻せる**: ✅（UI のみ）

## 6. リリース戦略
- **方式**: 一括（低リスクな導線追加）。同日 UI 改修バッチ + Google OAuth と合わせて次回 release。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC
- 全ページ footer に「他のアプリ」リンクを常設し、クリックで showcase（givers.work）を新規タブで開く。

### 7.2 入出力
- `SHOWCASE_URL = "https://givers.work"`（設定定数。将来 env 化も可）。
- リンク: `<a href={SHOWCASE_URL} target="_blank" rel="noopener noreferrer">他のアプリ</a>`。
- 配置: `LegalFooter` 内の独立した nav/section（法務リンクと区別、aria-label 付与）。文言は O38 準拠（技術用語なし・煽らない）。

### 7.3 データモデル
なし。

### 7.4 バリデーション・エラー
なし（外部リンク）。

### 7.5 機能固有 NFR + 既存連携
- O62: 公開マイクロサービス（habit-stack.givers.work）+ footer UI ありで該当。required_signals = 実リンクテキスト「他のアプリ」。
- O55: 導線とセット（footer 常設で orphaned にしない）。
- 既存の法務フッタ（O55）・入口リード（O41）は不変。

## 8. タグ別追加項目
- **i18n**: 「他のアプリ」は固定文言（JA 単一ロケール、ハードコード）。
- **analytics**: 流入計測は任意（本改修では計測コードは追加しない）。

## 9. 未決事項
> 現時点で論点なし (2026-06-13)。showcase URL は givers.work で確定（concept §4.7 / shipyard リブランド）。env 化は将来の任意改善（現状は定数集約で十分）。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-13 | 初版作成 | /flow:revise |
