# execution 機能仕様書

> **役割**: 活動セットを時間ベースで実行（開始→終了→一時停止→再開→次へ）。経過時間はタイムスタンプ差分で算出。アイテムごとの今日メモ。実行確定で達成日を記録。
> **タグ**: stateful（実行状態機械）, offline-critical（タイムスタンプ記録）, auth-required
> **最終更新**: 2026-06-08
> **入力**: `../concept.md` §1.1 UC4-5 / §5 / §3 NFR、`../_shared/`, `../design/design-system.md`
> **設計根拠**: D20260608-004（ローカルファースト + タイムスタンプ方式、生タイマー不使用）

---

## 1. 詳細 UC

### UC4: 時間ベースで実行・記録（concept §1.1 #4）
- トリガー: セットの「開始」
- フロー（状態機械）:
  1. セット開始 → execution_session 作成（status=running, started_at=now）、先頭アイテムの execution_record 開始（started_at=now）。
  2. 現アイテム「終了」→ record.ended_at=now、elapsed_sec = (ended_at - started_at) - paused_total_sec を算出保存。次の選択肢:
     - 「次のアイテムを開始」→ 次 record 開始
     - 「一時停止」→ session.status=paused、pause 開始時刻を保持
  3. 一時停止中 → 「同じ活動を再開」（paused_total_sec に加算して record 継続）or 「次を開始してセット再開」。
  4. 最終アイテム終了 or 「セット終了」→ session.status=done, ended_at=now。
- **経過時間 = 壁時計タイムスタンプ差分**。生タイマーを回さないため、バックグラウンド/スリープ/タブ閉じでも正確（再開時に now との差分で復元）。
- 進行中 session は IndexedDB に保持。アプリ再起動時に「進行中の実行」を復元。

### UC5: 今日の中身メモ（concept §1.1 #5）
- 各アイテム実行中/終了時に短文メモ（note ≤280）を record に保存。

### 達成日記録（継続の定義 D20260608-003）
- session が done になった時点（or アイテムを1つ以上実行した時点）で、その日のローカル日付について daily_achievements を upsert（achieved=true, item_done_count）。**セット単位・穴あき許容**（1 アイテム以上実行で達成）。

## 2. 入出力
### 2.1 状態遷移 API（local-sync 経由）
| 操作 | 状態遷移 | 副作用 |
|---|---|---|
| startSession | (none)→running | session + 先頭 record put |
| endItem | running→running(次) or paused | record.ended_at/elapsed_sec、達成判定 |
| pause | running→paused | pause 開始時刻保持 |
| resumeSame | paused→running | paused_total_sec 加算 |
| nextItem | paused/running→running | 次 record 開始 |
| endSession | →done | session.ended_at、daily_achievement upsert |

### 2.2 画面入力
| フィールド | 型 | バリデーション |
|---|---|---|
| note | text | 0..280 |

## 3. データモデル
- 既存（_shared/db）: execution_sessions / execution_records / daily_achievements を使用。新規なし。
- 進行中 session の一時状態（pause 開始時刻）はクライアント保持 + IndexedDB。

## 4. バリデーション + エラーケース
| ID | 条件 | 振る舞い |
|---|---|---|
| E1 | 既に進行中 session があるセットを再開始 | 既存を復元 or 終了確認 |
| E2 | オフライン実行 | ローカル記録、同期は復帰後 |
| E3 | アプリ再起動で進行中 session | IndexedDB から復元、経過は now 差分で再計算 |
| E4 | 端末時計が大きく戻る | elapsed_sec 負値を 0 にクランプ |
| V1 | note 281 文字 | 切り詰め or エラー |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| 経過時間精度 | バックグラウンド/スリープでも正確（タイムスタンプ差分） | §3 NFR 記録の正確性 |
| 状態復元 | アプリ再起動で進行中実行を復元 | UX |
### 5.2 連携
| 連携先 | 内容 |
|---|---|
| activity-sets | 実行対象のセット/アイテム参照 |
| _shared/local-sync | session/record 書き込み |
| streak-summary | daily_achievements を消費 |
| _shared/auth | owner |
| design-system | TimerControl/Button/Textarea |

## 6. タグ別追加項目
### 6.2 状態遷移（stateful）
- 状態: running / paused / done。遷移は §2.1。pause は record 単位の経過に paused_total_sec で反映。
- mermaid:
```
running --endItem--> running(次) | paused | done
paused --resumeSame--> running
paused --nextItem--> running
running --endSession--> done
```
### 6.3 オフライン（offline-critical）
- 全状態遷移は local-first。タイムスタンプは端末時計。同期は背景。
### 6.1 認可（auth-required）
- session/record は owner 紐付け、サーバ同期は withOwner。

## 7. スコープ外
- 複数セット同時実行（1 回 1 セット）
- 通知/アラーム（Web Push なし、MVP 外）
- 自動時間計測の補正（端末時計信頼、MVP）

## 8. 未決事項
- 現時点で論点なし（2026-06-08）。「達成」を session done 時のみとするか「1 アイテム実行時点」で即記録するかは UX 上「1 アイテム実行で即達成扱い（穴あき許容、D20260608-003）」で確定。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
