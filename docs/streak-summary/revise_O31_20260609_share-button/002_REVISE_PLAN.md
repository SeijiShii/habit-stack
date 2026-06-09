# streak-summary 変更計画書（O31 シェア導線）

## 1/2. 新規ファイル
| ファイル | 責務 |
|---|---|
| src/features/streak-summary/ShareButton.tsx | Web Share + fallback、編集可能短文 |
| src/features/streak-summary/ShareButton.test.tsx | 単体テスト |

## 1. 既存ファイル変更
| ファイル | 変更内容 |
|---|---|
| src/features/streak-summary/SummaryPage.tsx | 末尾に <ShareButton /> 追加 |
| src/styles/theme.css | .share / .share-actions スタイル追加 |

## 4. マイグレーション要否
- DB/Storage/Config 変更: ❌（なし）

## 5. 実装 Phase
- Phase 1（RED→GREEN）: ShareButton（render / 編集 / share 成功 / fallback copy）+ SummaryPage 配線。

## 9. DoD
- [ ] ShareButton unit green（render/編集/share/fallback）
- [ ] SummaryPage に常設表示
- [ ] 全 116+ tests green / build OK
- [ ] 視覚レビュー（P4.4）で確認 → 再デプロイ
