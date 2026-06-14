# 根本原因分析: aged guest session の Clerk reverification 403

> **入力**: `./000_調査レポート.md`, claim TRIAGE §7・§8, src/features/account/AccountPage.tsx, src/services/auth/linkWithGoogle.ts, src/components/auth/AuthProvider.tsx, src/services/auth/dataOps.ts
> **最終更新**: 2026-06-14

---

## 1. 5 Whys

| # | 問い | 答え |
|---|---|---|
| Why 1 | なぜボタンを押しても何も起きないのか? | `createExternalAccount` が 403 を返すが、`onLink` / `linkGoogle` / `linkWithGoogle` のどこにも catch が無く、403 を**無言で握り潰す**から（try/finally に catch 無し） |
| Why 2 | なぜ 403 が返るのか? | Clerk の **reverification（step-up 再認証）**が `createExternalAccount`（外部アカウント追加＝機密操作）に対し、セッションが reverification window 内に認証済みであることを要求し、満たさないと 403 を返すから |
| Why 3 | なぜ aged session が弾かれるのか? | aged session は reverification window が**切れている**から。PC のフレッシュセッション（直近サインイン）は window 内なので通る。= mobile 固有でなく **session 鮮度**の問題 |
| Why 4 | なぜゲストはこれを回復できないのか? | ticket ベースの匿名ゲストは password/email 等の **factor を持たず reverification を完了できない**。さらにサインアウト動線が無く（`AccountPage` は isLinked 時のみ）、リロードでも `AuthProvider` が isSignedIn なら ticket 再発行を skip → **ユーザー操作で回復不能** |
| Why 5（根本） | なぜ設計時に防げなかったのか? | dev instance（共有 OAuth）/ fresh session / E2E（stub auth）では一切露見せず、**production instance + aged guest session でのみ顕在化**する盲点。前回 fix C20260609-002 は動線（コード）を実装したが、**本番 aged session 経路を検証していなかった**ため、reverification 403 をテスト・検証どちらでも捉えられなかった（= 根本原因） |

## 2. 直接原因
| ファイル | 行 | 問題箇所 |
|---|---|---|
| `src/features/account/AccountPage.tsx` | `onLink`（修正前） | try/finally に **catch が無く** `linkGoogle()` の throw（403）が無言で消える＝「押しても何も起きない」 |
| `src/services/auth/linkWithGoogle.ts` | `createExternalAccount` 呼び出し | aged session では Clerk が 403 reverification を返すが、ここでも上位でも握られず reject が浮く |
| `src/components/auth/AuthProvider.tsx` | ticket 再発行分岐 | isSignedIn なら ticket 再発行を skip → aged guest がリロードでも fresh 化されず回復不能 |

## 3. 根本原因
**「fresh session でしか検証していない」ことで、Clerk reverification が aged guest session の `createExternalAccount` を 403 で弾く挙動を、テストでも本番検証でも捉えられなかった**こと。加えてコードに **403 を catch する経路が無く失敗が無言**だったため、症状が「押しても何も起きない」になり原因究明が遅れた。= 外部要因（Clerk reverification 仕様）× テスト不足（aged session ケース無し）× 検証ギャップ（fresh のみ）の複合。

## 4. 寄与要因
| 種別 | 内容 |
|---|---|
| 外部要因 | Clerk reverification 仕様が `createExternalAccount` に最近の認証を要求（aged session を 403）。ゲストは factor を持たず完了不能 |
| テスト不足 | aged session ケースのテストが無く、fresh mock でのみ green |
| 検証ギャップ | 前回 fix が fresh session（PC / シークレット）でしか実機確認せず、aged production guest を未検証 |
| コード | 連携失敗に catch が無く無言（403 がユーザーにも開発者にも見えない） |

## 5. 仮説と検証
| 仮説 | 検証方法 | 結果 |
|---|---|---|
| 本番 Clerk カスタム OAuth 未登録 | PC で /account「Google で引き継ぐ」を実踏 | ❌ 否定。client_id=578339694087-... 有効で accounts.google.com へ遷移＝OAuth 設定済 |
| reverification 403（aged session） | スマホ aged session で chrome://inspect リモートデバッグ | ✅ 確定。`POST /v1/me/external_accounts → 403 "additional verification"` を直接観測 |
| ゲストは reverification を完了できない | factor 有無 + サインアウト/リロード経路を確認 | ✅ ticket ゲストは factor 無し、`AccountPage` のサインアウトは isLinked 時のみ、`AuthProvider` は isSignedIn で ticket 再発行 skip → 回復不能 |

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版 | /flow:fix |
