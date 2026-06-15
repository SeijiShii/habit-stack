# 根本原因分析: ログイン状態で活動セットがパーシャルに消失

> **入力**: `./000_調査レポート.md`, Step 2 で読んだ実装（AuthProvider / repos / localStore / dataOps / syncQueue / conflict）
> **最終更新**: 2026-06-16

---

## 1. 5 Whys

| # | 問い | 答え |
|---|---|---|
| Why 1 | なぜ「夕方の勉強」セット＋実績だけが消えたか? | そのデータが current owner（U）と異なる owner（ゲスト G1）で IndexedDB に保存されており、app 初期化時の `wipeOtherOwners(U)` が **current 以外の owner のローカルデータを物理削除**したため（`localStore.ts:181-192` → `wipeOwner` `:146-171`）。 |
| Why 2 | なぜ 1 つのセットだけ owner が異なっていたか? | 既存 Google アカウントへのサインイン（`signInWithGoogle` fallback）で **Clerk userId が G1→U に churn** し、その境界を挟んで作成されたデータが旧 owner G1 のまま取り残されたため（owner は `userId` から解決: `AuthProvider.tsx:122-126`）。 |
| Why 3 | なぜ owner churn 時にローカルデータが旧 owner のまま取り残されるか? | **ローカル（IndexedDB）の owner 付け替えが存在しないため**。`reassignOwner`（`dataOps.ts:37-48`）はサーバ（Drizzle）専用で、かつ**コード中で一度も呼ばれていない（dead code）**。local-sync 側に owner 移行 API も呼び出しも無い。 |
| Why 4 | なぜ取り残された旧 owner データが「復元不能」なまで消えるか? | `wipeOwner` がエンティティに加え**当該 owner の未送信 outbox も削除する**（`localStore.ts:157-170`）ため。`wipeOtherOwners`（`repos.ts` useEffect）と同期 push（`useSync` useEffect）は**順序保証のない fire-and-forget** で、push 前に wipe が走ると未同期データがサーバ到達前に消滅する。 |
| Why 5（根本） | なぜそのような破壊的処理が導入されたか? | R20260615-001 が「既存アカウント＝SoT、デバイス上書き」を実現するため、**正当性に不要な物理 wipe（spec-review R2 自身が「owner 絞り read で混在表示は起きない」と認める）を、データ同期保証・owner 移行・ユーザー意図（連携=保持 vs 上書き）と切り離して導入した**こと。「上書き」判定を Clerk の `createExternalAccount` 成否（=既存アカウントか否か）に委ね、**ローカル未同期データの価値を考慮しないまま破壊**する設計になっていた。 |

> **根本原因（1 行）**: 「既存アカウントへのサインインを一律『デバイス上書き』とみなし、owner churn で旧 owner に
> 取り残されたローカル未同期データを（outbox ごと）物理削除する、同期保証・owner 移行・ユーザー意図と切り離された
> 破壊的 cleanup」を R20260615-001 が導入したこと。

## 2. 直接原因

| ファイル | 行 | 問題箇所 |
|---|---|---|
| `src/app/repos.ts` | 49-53 | `consumeDeviceOverwrite()` true で `store.wipeOtherOwners(ownerId)` を実行（破壊的処理のトリガ）。 |
| `src/services/sync/localStore.ts` | 181-192 | `wipeOtherOwners` が current 以外の全 owner を `wipeOwner` で物理削除。 |
| `src/services/sync/localStore.ts` | 146-171 | `wipeOwner` がエンティティ + **未送信 outbox** を削除（サーバ到達前の消滅 = 不可逆化）。 |
| `src/components/auth/AuthProvider.tsx` | 91-120, 181 | 既存アカウント連携済みを検出 → `markDeviceOverwrite()` → `signInWithGoogle`（userId churn を発生させる経路）。 |

## 3. 根本原因
R20260615-001 の「デバイス上書き」cleanup は、(1) 物理削除が正当性に不要（read が owner-scoped）であるにもかかわらず
導入され、(2) 削除前にローカルデータがサーバへ同期済みかを検証せず（outbox ごと消す）、(3) owner churn 時のローカル
owner 移行（`reassignOwner` のローカル版）を欠いたまま、(4) 「連携（データ保持）」と「上書き（既存データ優先）」の
区別をユーザー意図ではなく Clerk の連携成否に委ねた。結果、ゲスト中に作成した未同期データが、ユーザーが「ログインした
だけ」と認識する操作で恒久的に失われる。

## 4. 寄与要因
| 種別 | 内容 |
|---|---|
| テスト不足 | `wipeOtherOwners` の単体テストは「current 以外を消す」正の挙動を検証するが、「未同期 outbox がある owner を消すと復元不能」「churn 直後で同期未完のケース」のデータ消失リスクをテストしていない。E2E も owner churn × 未同期データの組合せ未カバー。 |
| 設計判断漏れ（ドキュメント） | auth INDEX [論点-009] が `reassignOwner`（案B）を「実装済」と記載するが**実際は未配線（dead code）**。SoT とコードの乖離が「owner 移行は手当て済み」という誤認を生み、wipe 導入時に移行欠落が見落とされた。 |
| レビュー漏れ | R20260615-001 spec-review は R2/R3 で wipe の発火条件（marker ガード）は議論したが、「**wipe 対象データが未同期＝復元不能になり得る**」不可逆性と outbox 同時削除を見落とした。「再 pull で復元可能（§4）」は**サーバ到達済みデータにしか成立しない**前提が明文化されていなかった。 |
| 外部要因 | Clerk の既存アカウントサインインが OAuth リダイレクトを伴い、切替境界で同期的なローカル整合処理ができない（spec-review R2 が opportunistic cleanup を選んだ理由）。これが「app init で事後 wipe」という危険な設計を誘発。 |

## 5. 仮説と検証
| 仮説 | 検証方法 | 結果 |
|---|---|---|
| 仮説1: owner churn 取り残し → wipeOtherOwners が物理削除 | コード経路 trace（AuthProvider churn → repos wipe → localStore 物理削除）+ owner-scoped read で「両方見えた」が churn 後は片方非表示になる整合 | **採用（主因）**。パーシャル消失を決定的に説明。 |
| 仮説2: ローカル owner 移行の欠如 | `reassignOwner` 呼び出し grep = 0 件（コメントのみ）。local-sync に owner 付け替え API なし | **採用（寄与・主因の前提）**。dead code を確認。 |
| 仮説3: markDeviceOverwrite の過剰適用 | `AuthProvider.tsx:111,181` で既存連携検出時に一律 mark。ユーザー意図/ローカルデータ価値を考慮せず | **採用（寄与）**。 |
| 仮説4: sync conflict による soft-delete | `conflict.ts` = 単純 LWW。サーバ tombstone が無ければ削除しない | **降格**（サーバ側 tombstone 混入の証跡が無い限り主因でない。Postmortem で server 側 pull データの確認は残す）。 |
| 復元可能性: 消えた G1 データがサーバに残るか | push が wipe 前に走っていれば `/api/sync/push` に G1 payload が到達した可能性。ただし server は owner 強制（SEC-001）で G1 を U に再owner するか拒否するか要確認 | **未確定**（Postmortem の復旧調査項目。race 次第で「サーバに orphan として残存」or「未到達で消滅」）。 |

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-16 | 初版 | /flow:fix |
