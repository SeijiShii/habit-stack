# streak-summary 機能仕様書

> **役割**: 達成日（daily_achievements）から継続日数・連続日数・期間指定の継続率を集計し、罪悪感を煽らない形で可視化。
> **タグ**: auth-required, analytics, offline-critical（ローカル集計可）
> **最終更新**: 2026-06-08
> **入力**: `../concept.md` §1.1 UC6 / §5.1、`../execution/`, `../_shared/`, `../design/design-system.md`
> **設計根拠**: D20260608-003（継続=セット単位・穴あき許容）、[論点-001]（罪悪感を煽らない見せ方）

---

## 1. 詳細 UC

### UC6: 継続サマリ（concept §1.1 #6）
- トリガー: サマリ画面。
- 入力: 期間指定（直近7日/30日/カスタム）、セット選択（全体 or 個別）。
- 処理:
  - **達成日数 / 対象日数 = 継続率**（達成 = セット単位・穴あき許容、1 アイテム以上実行）。
  - **連続日数（手応え）**: 直近で連続して達成した日数。途切れても咎めない表現。
  - **セット完遂率（補助）**: 全アイテム実行日 / 達成日。
  - 達成日をカレンダー風ドット（達成=accent、未達=空ドット・中立）で可視化。
  - 継続率を穏やかなバー/ゲージ（Recharts）。
- 出力: サマリ表示 + 「今週の手応えカード」（製品内グロース §4.8.2 のシェア対象）。

## 2. 入出力
### 2.1 集計 API
| 操作 | 入力 | 出力 |
|---|---|---|
| getSummary | {period, setId?} | { achievedDays, totalDays, rate, currentStreak, completionRate, dots[] } |

- 認証時はサーバ集計（/api/summary, withOwner）、匿名はローカル（daily_achievements from IndexedDB）。

## 3. データモデル
- 既存（_shared/db）: daily_achievements を消費。新規なし。

## 4. バリデーション + エラーケース
| ID | 条件 | 振る舞い |
|---|---|---|
| E1 | 達成日ゼロ | 「まだ記録がありません。ひとつから始めましょう」（前向き、咎めない） |
| E2 | 期間に未来日 | 対象日数は今日まで |
| E3 | オフライン | ローカル daily_achievements で集計 |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 |
|---|---|
| 集計応答 | daily_achievements の index で < 100ms |
| UX 安全性 | 未達を「失敗」に見せない（[論点-001]/charter §2.2） |
### 5.2 連携
| 連携先 | 内容 |
|---|---|
| execution | daily_achievements を書く（本機能が読む） |
| _shared/db | daily_achievements |
| _shared/local-sync | ローカル集計 |
| tip-jar | 満足ピーク（サマリ閲覧時）に応援導線 |
| design-system | AchievementDot/StreakBar/RateGauge、Recharts |

## 6. タグ別追加項目
### 6.6 analytics
- summary_viewed イベント（期間種別）。PII なし。
### 6.3 オフライン
- ローカル daily_achievements から集計。

## 7. スコープ外
- 他者比較/ランキング（charter §2.2、作らない）
- 詳細統計エクスポート（v2、収益は無関係）

## 8. 未決事項
- [論点-001]（concept §8）の罪悪感回避の最終ビジュアルは /flow:design 視覚レビューで確定。本 SPEC は「未達=空ドット中立・連続は手応え止まり・前向き空状態」を実装方針として確定。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
