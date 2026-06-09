# streak-summary 変更仕様書（O31 アプリ内シェア導線）

> 改修種別: 拡張 / issue: O31 / 基準: ../../streak-summary SPEC
> 由来: AUDIT_20260609_1851 High（O31 製品内グロース 未実装、concept §308 ★★★必須）

## 1. 変更概要
継続サマリ画面（SummaryPage）に、成果物シェア導線（ShareButton）を常設追加。Web Share API（navigator.share）+ フォールバック（X intent / クリップボードコピー）。編集可能な promote 短文を default 値に持つ。charter §2.2 整合（強制シェアモーダルなし・非ブロッキング・「シェアしなくても全機能無料」維持）。

## 2. 変更前 vs 変更後
| 対象 | 変更前 | 変更後 |
|---|---|---|
| SummaryPage | 継続率/ドット/streak のみ | 末尾に「このアプリを共有」セクション追加 |
| 新規 component | なし | ShareButton（navigator.share + fallback、編集可能短文） |

## 3. 影響範囲
| 対象 | 影響度 | 説明 |
|---|---|---|
| streak-summary | 中 | SummaryPage に section 追加 |
| 既存機能 | なし | 純追加（既存挙動不変） |

## 4. 後方互換性
- 互換維持 ✅（純追加、既存 API/データ/UI 不変）

## 5. ロールバック方針
- コード revert で戻せる ✅（DB 変更なし）

## 6. リリース戦略
- 一括（フィーチャーフラグ不要、新規 UI 追加のみ）

## 7. 詳細仕様
- **ShareButton**: props = `{ url, defaultText, share?, copy? }`（share/copy は注入可でテスト容易）。
  - 編集可能 textarea（promote 短文、maxLength 140）。
  - 「共有する」: `navigator.share({text,url})`（対応端末）→ 失敗/未対応なら fallback（clipboard コピー）。`role=status` で結果表示。
  - 「X で送る」: `https://twitter.com/intent/tweet?text=...&url=...` リンク。
  - charter §2.2: 非強制・常設・モーダル強制なし。
- **配置**: SummaryPage 末尾。url = `window.location.origin`（prod=habit-stack.givers.work）、defaultText = concept 提供価値 1 文（非バズ word-of-mouth トーン）。

## 9. 未決事項
現時点で論点なし（2026-06-09）。
