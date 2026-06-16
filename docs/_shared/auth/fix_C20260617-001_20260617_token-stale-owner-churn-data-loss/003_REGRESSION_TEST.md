# リグレッションテスト計画: guest 自前署名 JWT 永続による owner churn 根絶

> **入力**: `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`
> **最終更新**: 2026-06-17

---

## 1. 再発防止テストケース

### 1.1 直接原因を捉えるテスト（このバグが再発したら必ず落ちる）
| ID | 対象 | 入力 | 期待（修正前: 失敗 / 修正後: 成功） |
|---|---|---|---|
| RT-1 | owner 安定性 | guest JWT 保持状態で Clerk セッション失効をシミュレート → owner 解決 | owner（sub）が**失効前と不変**（修正前: 新 userId に churn して別 owner） |
| RT-2 | データ生存 | sub=G でデータ作成 → セッション失効 → 再起動相当で owner 再解決 → `getAllByOwner` | 作成データが**全件可視**（修正前: 空＝orphan） |
| RT-3 | guest token 永続 | 起動 → `getStoredGuestToken` 無 → fetch+store → 再起動相当 → 再利用 | 2 回目は fetch せず保存済 token 再利用（同一 sub）。`createUser`/再発行が呼ばれない |
| RT-4 | one-time migration | 旧 Clerk userId owner / local-guest owner のローカルデータが存在する状態で新方式初回起動 | 全データが新 sub へ `reassignOtherOwnersTo` され可視化（既存 orphan 回収）。冪等（2 回目 no-op） |

### 1.2 サーバ resolver（SEC-001 維持）
| ID | 対象 | 期待 |
|---|---|---|
| RT-5 | iss ルーティング | `iss=habit-stack-guest` の guest JWT → `verifyGuestToken` で sub を owner に解決。改竄/失効/iss 不一致 token は 401 |
| RT-6 | Clerk JWT 併存 | 連携済ユーザーの Clerk JWT は従来どおり Clerk 解決（guest 経路に誤受理しない） |
| RT-7 | client 送信値不信 | リクエストボディの owner/sub を信用せず**署名検証結果のみ**を owner にする（SEC-001） |

## 2. 類似境界条件テスト
| ID | 境界条件 | 期待振る舞い |
|---|---|---|
| RT-8 | localStorage 不可環境 | guest token 保存失敗 → degrade（次回再取得）。例外でアプリ停止しない |
| RT-9 | guest JWT 期限切れ（180 日超） | 失効検出 → 新規 provision（新 sub）。この時のみ churn するが極稀＋migration が緩和 |
| RT-10 | 連携成功時 | `clearGuestToken()` で guest token 破棄 → 以降 Clerk セッション。データは同一 owner で保持 |
| RT-11 | 既存アカウント sign-in（§1.6 fallback） | owner 切替時 `reassignOwner` で明示移行（silent orphan を作らない） |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| RT-12 | localStore owner-scoped read/write | owner キーの出所が変わるだけで read 隔離契約は不変 |
| RT-13 | selfDelete（O54 wipeOwner） | 自己削除は新 owner（sub）に対しても成立 |
| RT-14 | sync outbox / last-write-wins | owner=sub で push、サーバ owner 強制（SEC-001）不変 |
| RT-15 | C20260614-002 Google 連携 | 連携動線・reverification 緩和（新方式で guest 非 Clerk セッション化＝reverification 地雷自体が消える） |

## 4. Mock 方針
| 対象 | 固定値 | 理由 |
|---|---|---|
| guest JWT secret | テスト固定 secret | sign/verify を実コードで通す（O35 injectable） |
| sub 生成 | 固定 `guest_test_*` | 再現性 |
| Clerk セッション失効 | mock で `isSignedIn:false/userId:null` を注入 | 失効→再読込の churn 経路を unit で再現（実 TTL 待ち不要） |
| 時刻 | 固定 now | JWT exp 判定の再現性 |

## 5. カバレッジ目標
- 修正コード行: 100%（guestToken sign/verify、guestClient 永続、resolver iss 分岐、migration）。
- 「トークン失効→リロードでデータ生存」不変条件（RT-2）は**必須回帰固定**。

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-17 | 初版 | /flow:fix |
