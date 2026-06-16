# クレーム判定レポート

**claim id**: C20260617-001
**判定日**: 2026-06-17
**判定者**: Claude (claude-opus-4-8) + seiji
**判定**: **バグ (fix)**

## 1. 三項照合

### 1.1 期待 (Expected)
ログイン状態で作成したデータは、認証トークン（Clerk セッション）が時間経過で陳腐化し
再読み込みが起きても**保持され、可視であり続ける**。万一不可視化しても**再ログインで復旧**する。

### 1.2 既存仕様 (Spec)
- `concept.md §1.1 UC8`:「初回は匿名（IndexedDB に local-first 保存）で 0 タップ実行。**データを
  引き継ぎたいとき**に Google ログインを段階的に要求し、ローカルデータを引き継ぐ」。
- `concept.md §3 NFR データ整合性`:「匿名 → Google リンク時にローカルデータを**欠損なく引き継ぐ**」。
- `_shared/local-sync` SPEC: 読みは owner スコープ（`getAllByOwner` = 未削除レコードのみ）。
- → **データは local-first で保持され、認証状態の遷移で欠損してはならない**ことが明示。
  セッション期限切れ（＝内部状態の遷移）でデータが消える挙動を許容する記述は**皆無**。

### 1.3 現実 (Actual)
owner 継続性の欠落により、セッション期限切れで owner（= データの所有キー）が振り替わる:

- `src/components/auth/AuthProvider.tsx:122-126` — `ownerId = userId ? asOwnerId(userId) : ...`。
  owner は **Clerk の userId** に直結。セッションが失効すると `userId` が変わる/消える。
- `src/components/auth/AuthProvider.tsx:58-85` — 未サインイン時の自動ゲスト生成 effect。
  `fetchGuestTicket()` → `POST /api/auth/guest` → `signIn.create({ticket})` → `setActive`。
- `api/auth/guest.ts:24-34` — `clerk.authenticateRequest(req)` で既存セッションがあれば
  `refreshGuestTicket(同一 userId)`、**無ければ `issueGuestTicket` で新規ゲストを createUser**。
- `src/services/auth/guestSession.ts:33-38` — `issueGuestTicket` は毎回
  `clerk.users.createUser(...)` で**新しい userId を発行**する。
- `src/services/auth/localGuest.ts` — 永続するのは**オフライン用ローカルゲスト id のみ**。
  サーバ発行ゲスト userId はクライアントに**永続化されていない**。
- `src/services/sync/localStore.ts:82 getAllByOwner` — read は現 owner のみ返す。

**機序（再現の論理）**:
1. 初回起動 → セッション無し → `issueGuestTicket` が **userId=U1** を発行。データは U1 所有。
   セッション cookie が U1 を保持する間は、再読み込みしても owner=U1 で**データ生存**（claim の
   「その時点では再読み込みしてもデータが生きている」と一致）。
2. 時間経過で Clerk セッションが TTL 失効 → cookie/token が陳腐化。
3. 再読み込み → `useAuth()` が `isSignedIn:false / userId:null`（失効セッションは認証されない）。
4. 自動ゲスト生成 effect 発火 → `/api/auth/guest` の `authenticateRequest` が userId=null →
   **`issueGuestTicket` が新 userId=U2 を発行**（U1 を復元する手段が無い＝U1 はクライアント未永続）。
5. owner=U2 に振り替わり、`getAllByOwner(U2)` は空 → **U1 所有データが orphan 化＝画面から消失**
   （claim の「再読み込みが発生するとデータがデバイスから消える」と一致）。
6. 再ログイン: 匿名運用なら U1 は合成 email の匿名ユーザーで**再到達不能**＝復旧不能。
   Google 連携済みでも、サインイン経路で `reassignOtherOwnersTo` が発火する条件
   （`deviceOverwrite` marker）を満たさなければ orphan は戻らない（claim の「再ログインしても
   復旧しない」と一致）。

### 1.4 照合結果
**期待 = SPEC 記載（認証遷移でデータを欠損させない・引き継ぐ） ≠ 現実（セッション失効で owner churn →
データ orphan 化）** → 典型的な **バグ（実装が SPEC の保持・引き継ぎ保証に反した）**。
SPEC に消失を許容する記述は無く曖昧でもないため revise ではない。該当 SPEC（UC8/NFR）は存在するため
feature でもない。

## 2. 判定根拠

1. concept §1.1 UC8 / §3 NFR は「local-first 保持」「リンク時に欠損なく引き継ぐ」を明示し、認証トークン
   失効でデータが消える挙動を許容しない → 期待は SPEC 記載どおりで現実がそれに反する＝**バグ**。
2. 根本原因は **サーバ発行ゲスト userId のクライアント未永続**。`issueGuestTicket` が毎回 `createUser` で
   新 userId を発行する一方、その userId を再起動跨ぎで復元する仕組みが無いため、セッション失効＝owner churn＝
   owner スコープデータの orphan 化が**構造的に必然**に起こる（`localGuest.ts` の永続はオフライン
   fallback id のみで、サーバ userId は対象外）。
3. C20260616-001 とは**別バグ**。あちらの fix（`wipeOtherOwners` 撤去 → `reassignOtherOwnersTo`）は
   `deviceOverwrite` marker が立つ「明示的な既存アカウントサインイン」経路だけを非破壊化したもので、
   **marker が立たないサイレントな session-expiry churn 経路は一切触れていない**（`repos.ts:49-56` は
   `consumeDeviceOverwrite()` true のときしか reassign しない）。よって本件は C20260616-001 の回帰でも
   再燃でもなく、未着手だった別経路の欠陥。
4. 「再ログインで復旧しない」は、(a) 匿名運用で旧ゲスト userId が再到達不能、(b) Google 連携経路の
   reassign 不発（C20260614-002 系の連携失敗を含む）、のいずれか/両方で説明でき、現実挙動と整合。
5. 上記いずれもコードパス上の実装欠陥であり、仕様の曖昧さ・未設計ではない → **バグ（fix）で確定**。

> 注: 根本原因の中核は #2（ゲスト userId 未永続による owner 不連続）と高確度で特定済みだが、
> 「再ログインで戻らない」副経路（連携失敗 vs reassign 不発）の確定は /flow:fix 調査に委ねる。

### 2.1 /flow:fix へ引き継ぐ調査仮説（優先度順）
1. **ゲスト userId の永続化欠落（中核）**: `issueGuestTicket` の userId をクライアントに永続し、
   セッション失効後も**同一 userId へ `refreshGuestTicket` で復帰**させる（owner を不変に保つ）。
   - 設計上の難所: `api/auth/guest.ts` は SEC-001 でクライアント送信値を信用せずサーバセッションから
     userId 解決する方針。失効後はサーバセッションが無いため、クライアント保持の userId を「どう安全に
     信用するか」を解く必要がある（署名付きトークン/longlived guest credential 等）。**セキュリティ設計の
     論点を含む** → fix 内で `/flow:secure` 連携 or 設計判断（場合により付随 revise）。
2. **churn 時の自動 reassign**: marker 有無に依らず、owner が変わった瞬間に旧 owner ローカルデータを
   新 owner へ `reassignOtherOwnersTo` で付け替える（`repos.ts` の発火条件を marker 限定から拡張）。
   - リスク: 共有端末で別人ゲストのデータを誤って引き継ぐ懸念 → owner 信頼境界の検討要。
3. **local→server guest の二重 owner**: 単一ロード内でも `local-guest-UUID`（fallback）→ サーバ userId へ
   owner が遷移し、その隙間で作られたデータが取り残されうる（`AuthProvider.tsx:122-126`）。
4. **Google 連携の堅牢性（再ログイン復旧経路）**: C20260614-002 系の連携失敗で owner が anon のまま churn
   すると「再ログインで戻らない」。連携成功保証 + サインイン時 reassign の確実な発火を確認。

## 3. 推奨分岐先

- **コマンド**: `/flow:fix`
- **引数**: `_shared/auth C20260617-001 --severity=high --from-claim=C20260617-001`
- **severity / scope**: high。理由 = 不可逆なデータ消失クラスかつ**発火が受動・不可避（全ユーザーが
  時間経過で到達）**。報告は 1 名・要再現確認のため critical ではなく high だが、latent 影響の広さから
  fix 調査で critical 再評価の余地あり。scope = ゲスト owner 継続性（_shared/auth ⇔ _shared/local-sync 協働、
  guest ticket 発行のサーバ設計／SEC-001 境界も視野）。
- **優先度**: 高。データ消失系のため Postmortem（fix 004）推奨。SEC 設計論点があるため fix 内で
  `/flow:secure` 連携を想定。

## 4. 却下時の対応
（該当なし）

## 5. 判定保留時の論点
（該当なし）

## 6. 関連

- クレーム原文: `./000_CLAIM_REPORT.md`
- 別機序の先行データ消失 fix（デプロイ済）: `../fix_C20260616-001_20260616_set-data-loss-after-login/`
- 連携失敗の素地: `../claim_C20260614-002_20260614_google-login-no-op/`、`../fix_C20260614-002_20260614_google-link-reverification/`
- local-sync 設計: `../../local-sync/001__shared_local-sync_SPEC.md`
- 分岐先サブフォルダ: `../fix_C20260617-001_20260617_token-stale-owner-churn-data-loss/`（Step 6 で作成）
