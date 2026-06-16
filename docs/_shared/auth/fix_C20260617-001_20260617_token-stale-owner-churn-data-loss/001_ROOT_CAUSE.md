# 根本原因分析: 認証トークン陳腐化 → owner churn によるデータ消失

> **入力**: `./000_調査レポート.md`, AuthProvider.tsx / repos.ts / guest.ts / guestSession.ts / localGuest.ts / localStore.ts
> **最終更新**: 2026-06-17

---

## 1. 5 Whys

| # | 問い | 答え |
|---|---|---|
| Why 1 | なぜ再読込でデータが消える（画面に出ない）のか? | 現 owner（`getAllByOwner(currentOwner)`）にデータが無いから。データは別 owner（旧ゲスト userId）に紐づいたまま IndexedDB に残存（物理削除ではない＝orphan 化）。`localStore.ts:82`。 |
| Why 2 | なぜ現 owner が旧 owner と変わる（churn する）のか? | owner = Clerk の userId 直結（`AuthProvider.tsx:122-126`）。セッション失効後の再読込で `userId` が新しい値に振り替わるため。 |
| Why 3 | なぜセッション失効後の再読込で新しい userId になるのか? | 自動ゲスト生成 effect（`AuthProvider.tsx:58-85`）が `/api/auth/guest` を叩き、サーバが失効でセッション復元できず（`authenticateRequest`→userId=null）→ `issueGuestTicket` が **新規ゲストを createUser**（`guest.ts:24-34` / `guestSession.ts:33`）するから。 |
| Why 4 | なぜ「同じゲスト」に復帰せず毎回新規 createUser になるのか? | サーバ発行のゲスト userId を**クライアントが永続していない**ため、失効後に「自分は U1 だった」とサーバへ示す手段が無い。永続しているのは offline 専用のローカルゲスト id のみ（`localGuest.ts`、サーバ userId とは別物）。 |
| Why 5 | なぜサーバ発行ゲスト userId が永続されていないのか? | **設計時の既知 open 論点（論点-009「ゲスト→アカウント owner 統合方式」）で「案A=Clerk セッション永続化アップグレード」が未着手のまま**だったから。匿名ゲストの owner 継続性（セッション失効耐性）が設計で詰められておらず、reassignOwner（案B）も marker 経路でしか発火しない。**＝根本原因**。 |

> **根本原因（確定）**: 匿名ゲストの owner 識別子（サーバ発行 userId）に**セッション失効を跨ぐ継続性が無い**。
> その結果、トークン陳腐化のたびに owner が churn し、owner スコープのローカルデータが orphan 化する。
> reassignOwner（案B）は実装済だが `deviceOverwrite` marker（明示サインイン）でしか発火せず、
> サイレントな churn 経路を救済しない。

## 2. 直接原因

| ファイル | 行 | 問題箇所 |
|---|---|---|
| `src/services/auth/guestSession.ts` | 33-38 | `issueGuestTicket` が毎回 `createUser` で新 userId を発行。失効後は必ず別 userId になる。 |
| `src/components/auth/AuthProvider.tsx` | 122-126 | `ownerId = userId ? asOwnerId(userId) : …` で owner を Clerk userId に直結。userId が変われば owner が変わる。 |
| `src/app/repos.ts` | 49-56 | orphan 救済の `reassignOtherOwnersTo` が `consumeDeviceOverwrite()` true 時のみ発火。サイレント churn では走らない。 |
| `src/services/sync/localStore.ts` | 82 | `getAllByOwner` は現 owner のみ返す（仕様どおり）。churn 後は旧 owner データが見えない。 |

## 3. 根本原因
匿名ゲストの **owner 継続性（セッション失効耐性）が設計で未定義**。`issueGuestTicket` の毎回 createUser は
「初回 0 タップ起動」には妥当だが、「同一端末で同一ゲストを失効後も維持する」要件が論点-009 案A 未着手の
まま放置され、セッション失効＝owner churn＝orphan という構造的欠陥になった。C20260616-001 fix は破壊的 wipe を
非破壊 reassign に替えたが、reassign の発火を marker 経路に限定したため、本サイレント churn 経路は素通しのまま。

## 4. 寄与要因
| 種別 | 内容 |
|---|---|
| 設計・ドキュメント不足 | 論点-009（owner 統合方式・Clerk 永続化）が open のまま実装が進み、ゲスト owner 継続性の要件が SPEC に明文化されていなかった。 |
| テスト不足 | 「セッション失効 → 再読込 → owner 変化 → データ可視性」を検証する統合テストが存在しない（unit は owner 固定で churn を再現しない）。 |
| 検知不足 | churn はサイレント（エラーログ・例外なし）。監視・計測が無く、ユーザー報告まで気づけない。 |
| 外部要因 | Clerk セッションの TTL / inactivity timeout 挙動（匿名ゲストでも通常セッションと同様に失効しうる）。 |

## 5. 仮説と検証
| 仮説 | 検証方法 | 結果 |
|---|---|---|
| churn の主因はゲスト userId 未永続 | `guestSession.ts`/`guest.ts`/`localGuest.ts` を Read。サーバ userId をクライアント保持/送信する経路が無いことを確認 | ✅ 確定（永続は offline ローカル id のみ） |
| reassign が救済しない | `repos.ts:49-56` が `consumeDeviceOverwrite()` gate 下でのみ reassign することを確認 | ✅ 確定（marker 限定） |
| 物理削除ではなく orphan 化 | `localStore.ts` の reassign/wipe を Read。churn 経路に wipe は無い＝データは残存し read から外れるだけ | ✅ 確定（不可逆は「再到達不能」による事実上のもの） |
| 「再ログインで戻らない」副経路 | 匿名は U1 再到達不能、連携済みは reassign 不発（marker 非発火 or 連携失敗 C20260614-002） | ⚠ 主因は確定、副経路の比率は実機計測で要追認 |

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-17 | 初版（5 Whys 完結、根本＝ゲスト owner 継続性欠落／論点-009 案A 未着手） | /flow:fix |
