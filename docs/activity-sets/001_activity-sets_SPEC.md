# activity-sets 機能仕様書

> **役割**: 活動セット（時間帯ごとのルーティン）とその中のアイテム（個々の習慣）の CRUD・並べ替え。
> **タグ**: auth-required（owner 自分のみ）, offline-critical（local-first）, stateful（並べ替え順序）
> **最終更新**: 2026-06-08
> **入力**: `../concept.md` §1.1 UC1-3 / §5.1、`../_shared/{db,auth,local-sync,types}/`, `../design/design-system.md`

---

## 1. 詳細 UC（画面別フロー）

### UC1: 活動セットを作る（concept §1.1 #1,#3）
- トリガー: セット一覧画面「+ 新しいセット」
- 入力: name（1..60）、time_of_day（朝/昼/夕/夜 チップ選択）
- 処理: local-sync.put(activity_set) → outbox → 同期。owner はサーバ強制。
- 出力: 一覧に追加、編集画面へ。

### UC2: アイテムを CRUD・並べ替え（concept §1.1 #2）
- セット編集画面でアイテム追加（name）、編集、削除（softDelete）、ドラッグ並べ替え（sort_order 更新）。
- local-first 即反映、同期は背景。

### UC3: 活動セットを編集・削除（concept §1.1 #3）
- セット名/時間帯変更、削除（配下アイテムも softDelete）。
- セット並べ替え（時間帯内 or 全体の sort_order）。

## 2. 入出力

### 2.1 ローカル/同期（API は _shared/local-sync 経由）
| 操作 | 対象 | 副作用 |
|---|---|---|
| createSet | activity_sets | put + outbox |
| updateSet / deleteSet | activity_sets | put(updated_at) / softDelete |
| createItem / updateItem / deleteItem | activity_items | 同上 |
| reorder | sort_order 一括更新 | put 複数 |

### 2.2 画面入力
| フィールド | 型 | 必須 | バリデーション |
|---|---|---|---|
| set.name | text | ✅ | 1..60, trim 非空 |
| set.time_of_day | enum | ✅ | morning/noon/evening/night |
| item.name | text | ✅ | 1..60 |
| sort_order | int | ✅ | >= 0 |

## 3. データモデル
- 既存（_shared/db）: activity_sets / activity_items を使用。新規エンティティなし。

## 4. バリデーション + エラーケース
| ID | 条件 | 表示 |
|---|---|---|
| V1 | name 空 | 「名前を入れてください」 |
| E1 | 他人のセット参照 | requireOwner で 404（発生しない、UI は自分のみ取得） |
| E2 | オフライン編集 | ローカル成功、「あとで自動で保存します」 |
| E3 | 削除済みセットのアイテム操作 | 無効化 |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 |
|---|---|
| 操作反映 | local-first で即時（< 50ms 体感） |
### 5.2 連携
| 連携先 | 内容 |
|---|---|
| _shared/local-sync | 全書き込み |
| _shared/auth | useOwner / withOwner |
| _shared/db | activity_sets/items |
| execution | 実行画面がセット/アイテムを参照 |
| design-system | トークン/コンポーネント（Card/Chip/Button/Input） |

## 6. タグ別追加項目
### 6.1 認可（auth-required）
- 一覧/編集は useOwner の owner のみ。サーバ API は withOwner。
### 6.2 状態（stateful）
- sort_order による並び順。ドラッグで再採番（隣接 swap or 連番振り直し）。
### 6.3 オフライン（offline-critical）
- 全 CRUD は local-sync 経由、オフライン可。

## 7. スコープ外
- セットの共有/コピー（v2）
- テンプレートセット（v2）

## 8. 未決事項
- 現時点で論点なし（2026-06-08）。並べ替えの sort_order 採番方式（隣接平均 or 連番）は実装時に確定（推奨: 連番振り直しで単純化）。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
