# リグレッションテスト計画: Google ログイン/連携動線

> **入力**: `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`
> **最終更新**: 2026-06-09

---

## 1. 再発防止テストケース

### 1.1 直接原因を捉えるテスト（このバグが再発したら確実に検知）
| ID | 対象 | 入力 | 期待（修正前: 失敗 / 修正後: 成功） |
|---|---|---|---|
| RT-1 | 動線到達性（O55） | アプリ全画面 / nav を render | 「アカウント」inbound 動線が存在し `/account` に到達できる（修正前: 動線ゼロ=失敗） |
| RT-2 | `linkWithGoogle()` 存在・呼び出し | mock Clerk user で `linkWithGoogle(user, redirectUrl)` | `user.createExternalAccount({strategy:'oauth_google', redirectUrl})` が呼ばれ redirect URL へ遷移（修正前: 関数不在=失敗） |
| RT-3 | AccountPage 表示分岐 | `isLocalGuest=true` / `isLinked=true` | ゲスト時=「Google で引き継ぐ」CTA 表示 / 連携済=email 表示 + サインアウト |

### 1.2 修正後に必ず通るテスト
| ID | 対象 | 期待 |
|---|---|---|
| RT-4 | OwnerContext 拡張 | `isLinked`/`email` が AuthProvider から正しく供給される |
| RT-5 | post-link sync | 連携成功時に sync push が起動（同一 id=push のみ / 新 id=reassignOwner→push） |

## 2. 類似境界条件テスト
| ID | 境界条件 | 期待振る舞い |
|---|---|---|
| RT-6 | Clerk キー未設定（LocalOwnerProvider / keyless） | `/account` は「オフライン・ローカルのみ」を表示し連携ボタンは無効化（クラッシュしない、offline-first 維持） |
| RT-7 | 連携中断（OAuth キャンセル / redirect 失敗） | 匿名セッション維持、再試行可能（auth SPEC §エラー「Google リンク中断 → 匿名セッション維持」） |
| RT-8 | 既に連携済ユーザーが再度 /account | 二重連携せず email 表示のみ |
| RT-9 | tip 課金フロー | **ログイン要求が出ない**（donation 非ゲート、O46🎁。tip Checkout がゲストのまま開く） |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| RT-10 | `src/components/auth/AuthProvider.test.tsx` | guest ticket フローは無改変 |
| RT-11 | `src/services/auth/*.test.ts`（owner/dataOps/guestSession） | reassignOwner / owner-check は再利用、変更なし |
| RT-12 | `src/features/local-sync/*.test.ts` | sync は配線追加のみ、既存挙動維持 |
| RT-13 | 全 116 既存テスト | additive 変更のため全 green を維持 |

## 4. E2E シナリオ追加
| シナリオ ID | バグ再現 → 修正後の確認 |
|---|---|
| E2E-1 | ゲスト起動 → nav「アカウント」→ /account に「Google で引き継ぐ」CTA が見える（headless で動線到達を検証。実 OAuth は release 実機 smoke） |

## 5. Mock 方針
| 対象 | 固定値 | 理由 |
|---|---|---|
| Clerk `useUser` / `createExternalAccount` | mock（成功/中断/keyless） | 実 Google OAuth はローカルで叩けない。injectable seam（O35）で分岐を網羅 |
| redirect URL | 固定 | 再現性 |

## 6. カバレッジ目標
- 修正コード行（linkWithGoogle / AccountPage / OwnerContext 拡張 / post-link sync）: 100%
- 境界条件（keyless / 中断 / 二重連携 / tip 非ゲート）: 90%+

## 7. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-09 | 初版 | /flow:fix |
