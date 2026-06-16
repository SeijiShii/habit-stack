# 修正計画: bousai revise_003 の guest 自前署名 JWT 機構を habit-stack へ移植

> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, bousai-bag-checker `src/shared/auth/*` + `api/auth/_lib/guest-provision.ts`
> **方針**: 案A（恒久予防＝churn 根絶）+ one-time orphan migration（既存被害回収）。ユーザー決定「bousai の機構を移植」。
> **最終更新**: 2026-06-17

---

## 1. 修正対象ファイル

### 1.1 新規追加（bousai を範型に移植）

| ファイル | 内容 | bousai 範型 |
|---|---|---|
| `src/services/auth/guestToken.ts` | 自前署名 guest JWT (HS256) の sign/verify 純関数。`iss="habit-stack-guest"`、TTL 180 日、`sub=guest_<uuid>`。secret は引数注入（env 読まない＝O35 testable）。**sign はサーバ専用**。 | `src/shared/auth/guest-token.ts` |
| `src/services/auth/guestClient.ts` | フロント SDK 非依存ヘルパ: `getStoredGuestToken`/`storeGuestToken`/`clearGuestToken`（localStorage key `habit-stack.guestToken`）+ `fetchGuestToken`（`POST /api/auth/guest` → `{guestToken}`）+ `buildEnsureGuestToken`（未保持なら 1 度取得して保持）。 | `src/shared/auth/guest-client.ts` |
| `api/auth/_lib/guestProvision.ts` | `provisionGuest`: rate limit → `genSub()`（`guest_<uuid>`）→ DB 匿名行 upsert → `signGuestToken(sub)`。**Clerk createUser しない**（MAU 不消費、churn 源の除去）。 | `api/auth/_lib/guest-provision.ts` |

### 1.2 改修

| ファイル | before | after |
|---|---|---|
| `api/auth/guest.ts` | `establishGuestSession` で Clerk 匿名 user 作成 + `{ticket}` 返却 | `provisionGuest` を呼び `{guestToken}` 返却（既存セッション有無で分岐しない＝per-call createUser 撤去） |
| `src/services/auth/guestSession.ts` | `issueGuestTicket`（毎回 `createUser`）/ `refreshGuestTicket` | guest JWT 発行に置換。`issueGuestTicket`/ticket 経路を撤去（§1.5 fresh 化は guest 非 Clerk セッション化で不要に） |
| owner resolver（サーバ）`api/_shared/*` + `src/services/auth/clerkOwnerAdapter` 系 | Clerk JWT から userId 解決のみ | **iss でルーティング**: `iss=habit-stack-guest` の guest JWT は `verifyGuestToken(secret)` で `sub` を owner に、それ以外は従来 Clerk 解決。SEC-001 維持（client 送信値でなく署名検証で sub 確定） |
| `src/components/auth/AuthProvider.tsx`（ClerkOwnerBridge） | 未 sign-in → ticket 自動 sign-in（Clerk セッション化、owner=Clerk userId） | 未 sign-in → `ensureGuestToken`（保持済なら再利用、無ければ fetch+store）。owner = guest JWT の `sub`。Clerk にサインインしない。連携時のみ Clerk セッションへ切替し `clearGuestToken()` |
| httpBackend / `src/lib/api`（Authorization 付与箇所） | Clerk `getToken()` を Bearer | Clerk 未サインイン時は保持 guest JWT を Bearer 付与 |
| `src/app/repos.ts` | `consumeDeviceOverwrite()` 時のみ reassign | **one-time migration**: 新方式初回起動で安定 `sub` 確立後、`reassignOtherOwnersTo(sub)` で既存 orphan ローカルデータを回収（§4 移行） |

### 1.3 撤去/縮退
- `deviceOverwrite` marker 経路は §1.6 既存アカウント sign-in でのみ意味を持つ形に縮退（guest churn 救済は新方式で不要に）。`markDeviceOverwrite` 自体は既存アカウント上書き用に残す。

## 2. 修正範囲の限定方針
- **根本原因（guest identity 未永続）を断つ案A を主**とし、既存被害は one-time migration で回収。
- bousai/hana-memo/naze-bako で本番実証済みパターンの移植のため新規設計リスクは低い。ただし **habit-stack 固有の同期層（Neon + Drizzle outbox / owner-scoped IndexedDB）への owner=sub 適用**は個別検証（perspectives O22 (D) ①〜⑤ を移植先でも個別確認＝「他 PJ の正解を丸ごと移植しない」note 準拠）。

## 3. 副作用なき確認方法
- 既存テスト維持: owner-scoped read/write、selfDelete(O54 wipeOwner)、sync outbox、Google 連携(C20260614-002)。
- 追加テスト: `003_REGRESSION_TEST.md`。
- 手動確認（aged guest）: ① ログイン無しでデータ作成 → guest JWT が localStorage に保存される ② Clerk セッションを失効/クリアして再読込 → **owner（sub）が不変・データ生存** ③ 連携 → データ保持 ④ サインアウト/別アカウント sign-in の意味論不変。

## 4. リリース戦略
- 方式: **段階展開可能な通常リリース**（high・受動トリガーで進行中のため早期反映）。
- **移行（one-time migration）**: 新方式初回起動で、(a) guest JWT 未保持なら新 `sub` を発行・保持、(b) 既存ローカルデータ（旧 Clerk userId owner / local-guest owner）を新 `sub` へ `reassignOtherOwnersTo` で付け替え。冪等・1 回限り（フラグで管理）。これで「既に消えた（orphan 化した）ローカルデータ」も復活。
  - ⚠️ サーバ（Neon）に旧 owner で push 済みのデータは、旧 Clerk userId が再到達不能だと回収不能（ローカル orphan は回収可）。Postmortem §再発防止で別途データ復旧調査を起票。
- フィーチャーフラグ: guest 方式切替は env / ビルド定数で gate 可能にし、問題時に旧経路へ戻せるようにする（ロールバック弁）。

## 5. ロールバック方針
- コード revert で戻せる: ✅（新ファイル追加 + 分岐切替が主）。
- guest JWT secret（`GUEST_TOKEN_SECRET`）を env 追加 → release Phase 1 FILL 対象。
- 切替フラグ OFF で旧 ticket 経路へ即時復帰可（移行 migration は冪等なので二重実行安全）。

## 6. 関係者通知
- 本人（seiji）。prayer-list は同型バグ → 別 `/flow:claim+fix` を tracked follow-up 起票。

## 7. DoD
- [ ] guest JWT 発行/検証/永続が実装され、Clerk 非サインイン時の owner が `sub` 由来で**セッション失効・リロードをまたいで不変**
- [ ] one-time migration で既存 orphan ローカルデータが新 sub へ回収される
- [ ] サーバ resolver が iss で guest/Clerk JWT を振り分け（SEC-001 維持＝署名検証で sub 確定）
- [ ] `003_REGRESSION_TEST` 全 green（特に「トークン失効→リロードでデータ生存」回帰）
- [ ] 既存テスト（owner-scoped / O54 / sync / C20260614-002 連携）破壊なし
- [ ] **`/flow:audit` step 3.9 が本 PJ で PASS する**（guest_identity_persistence signal が存在＝churn 根絶の機械的確認）
- [ ] Postmortem 再発防止策に担当 + 期限

## 8. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-17 | 初版（案A bousai 移植 + one-time migration、ユーザー決定） | /flow:fix |
