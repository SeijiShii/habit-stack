# バグ修正: 認証トークン陳腐化 → owner churn によるデータ消失（C20260617-001）

- **fix id**: C20260617-001
- **起点クレーム**: `../claim_C20260617-001_20260617_token-stale-owner-churn-data-loss/001_TRIAGE.md`（decision: D20260617-003）
- **severity**: high（不可逆データ消失クラス／受動・不可避トリガー）
- **対象**: _shared/auth（ゲスト owner 継続性、_shared/local-sync 協働）
- **状態**: 修正計画済（案A=bousai guest-JWT 永続の移植 + one-time orphan migration）→ /flow:tdd 実装へ
- **flow tooling 是正**: 本バグ class を audit が検知できなかった穴を CF-20260617-001 で是正済（perspectives O22 (D) + audit #4 step 3.9 + scaffold §1.7、flow-suite commits d01215a/829a1f1/38fd50e/cc095eb/9e451f8）。検証: bousai PASS / habit-stack・prayer-list HIGH fire

## 根本原因（claim triage からの引き継ぎ）
サーバ発行ゲスト userId のクライアント未永続。`issueGuestTicket`（`src/services/auth/guestSession.ts:33`）が
毎回 `createUser` で新 userId を発行し、Clerk セッション TTL 失効後に同一 userId を復元する手段が無いため、
再読込で新ゲスト userId へ owner churn → `getAllByOwner` が旧 owner データを返さず orphan 化（不可視＝消失）。
C20260616-001 fix（wipe→reassign）は `deviceOverwrite` marker 経路のみ是正で、本 silent churn 経路は未着手。

## 調査仮説（優先度順、詳細は claim 001_TRIAGE.md §2.1）
1. ゲスト userId の永続化 + 失効後の同一 userId 復帰（SEC-001 境界の設計論点を含む → secure 連携想定）
2. churn 時の自動 reassign（marker 限定の発火条件を拡張）
3. local-guest → server-guest の二重 owner 遷移の隙間
4. Google 連携の堅牢性（再ログイン復旧経路、C20260614-002 系）
