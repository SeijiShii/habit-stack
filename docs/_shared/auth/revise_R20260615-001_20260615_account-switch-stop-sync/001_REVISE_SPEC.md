# _shared/auth 変更仕様書（アカウント切替時の計時停止条件緩和 + デバイス⇔アカウント同期ポリシー）

> **改修種別**: 機能変更（停止トリガの再設計）+ バグ修正（強制停止時データ消失）+ ポリシー明文化（cross-owner データ同期）
> **issue / slug**: R20260615-001 / account-switch-stop-sync
> **基準 SPEC**: `../001__shared_auth_SPEC.md`
> **最終更新**: 2026-06-15
> **タグ**: auth-required（owner-scoped, SEC-001）、offline-critical（local-first / IndexedDB 正本）、stateful（進行中セッション単一）

---

## 1. 変更概要

現状は `/account` 画面へ**遷移しただけ**で計時中セッションが強制停止される（`LoginEndGuard` が `isLoginPath` で `endInProgressNow` を発火）。本改修は停止条件を **「アカウント切替（Google ログイン / サインアウト）を明示的に実行したとき」** に限定し、(1) 切替直前に進行中があれば「計時中の活動を停止しますか」と確認、(2) 強制停止時にデータが保存されず消える不具合を是正、(3) アカウント切替境界のデバイス⇔Google アカポリシー（連携アップロード / 既存データ上書き / サインアウト時デバイス削除）を明文化・配線する。永続データ形状・DB スキーマは不変（後方互換、migration 不要）。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC-EX-LOGIN-END（停止トリガ） | `/account` 等ログインパスへ遷移した瞬間に進行中セッションを強制終了（`LoginEndGuard`） | **アカウント切替（ログイン/サインアウト）を押した時のみ**停止。単なる `/account` 閲覧では停止しない | 画面を見るだけで計時が止まるのは過剰。R20260614-001 で進行中は一覧バッジ + 復帰導線が確立済 |
| UC-ACCT-SWITCH-CONFIRM（確認）※新規 | （なし。無言で強制終了） | 切替直前に進行中があれば「計時中の活動を停止しますか」を確認。OK→停止して切替 / キャンセル→切替中止（計時継続） | 進行中の不可逆停止を無言で行わない |
| UC-ACCT-LINK（未連携ログイン） | 連携時の挙動が暗黙（同一 userId 維持で概ね保持されるが、guest churn で消える経路あり） | デバイスのゲストデータを**当該アカウントへ連携・保存（アップロード）**。データは保持 | 要望4。作成済みデータの消失を防ぐ |
| UC-ACCT-OVERWRITE（既存データ持ちログイン） | signInWithGoogle fallback で owner 切替（旧データは orphan 化、明示削除なし） | 既存アカウントのデータで**デバイスを上書き**。デバイスのゲストデータはローカルから除去 | 要望5。アカウント＝SoT を明確化 |
| UC-ACCT-SIGNOUT（サインアウト） | `clerk.signOut()` のみ（デバイスのローカルデータは残置 orphan） | サインアウト時に**デバイス（ローカル IndexedDB）のデータを削除**。アカウント（サーバ）データは保持 | 要望6。端末にデータを残さない |

### 2.2 入出力変更
| 対象 (画面 / 関数) | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `App.tsx` `LoginEndGuard` (224-232) | `isLoginPath(pathname)` で `endInProgressNow` を発火 | **撤去**（path 起因の自動停止を廃止） | 互換（停止契機の移動。データ形状不変） |
| `AccountPage.tsx` `onLink` (54-66) | `linkGoogle()` を即実行 | 進行中があれば確認ダイアログ→OK で停止（保存）→`linkGoogle()`。キャンセルで中止 | 互換（確認ステップ追加） |
| `AccountPage.tsx` `onSignOut` (68-76) | `signOut()` を即実行 | 進行中があれば確認→OK で停止（保存）→`signOut()`。キャンセルで中止 | 互換（確認ステップ追加） |
| `AuthProvider.tsx` `signOut` (186-188) | `clerk.signOut()` のみ | `clerk.signOut()` 後にデバイスのローカルデータを wipe（`clearLocalData`） | 互換（副作用追加。サーバ無傷） |
| `AuthProvider.tsx` signInWithGoogle fallback (90-116) | owner 切替のみ（旧 guest データ orphan） | 既存アカウントへ切替時、デバイスのゲストローカルデータを wipe（上書き = account データ pull） | 互換（副作用追加） |
| `localStore`（local-sync） | `clear` 系は wipeOwner(outbox) 等限定 | **`clearLocalData(ownerId?)`** を提供（owner 指定または全 owner のローカルエンティティを物理削除、サーバ非干渉） | 互換（API 追加） |
| `AccountPage` props | `onDeleteAllData?`, `onDeleted?` | 進行中確認のため `findInProgress`（または `hasInProgress`）解決手段を注入 / `onConfirmStop` 注入 | 互換（optional prop 追加） |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `activity_set` / `activity_item` / `execution_session` / `execution_record` / `daily_achievement` | スキーマ・列とも**変更なし** | 不要 |
| ローカル IndexedDB ストア | 構造変更なし。サインアウト/上書き時に owner スコープで物理削除する操作を追加 | 不要（runtime データ操作） |
| owner_id | 変更なし（Clerk userId / local guest id）。連携時の同一 userId 維持 or reassignOwner は既存どおり | 不要 |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| 進行中あり + アカウント切替 | 無言で強制終了 | 確認ダイアログ。キャンセルで切替中止（破壊的操作を促さない） |
| 連携 / サインイン失敗（403 reverification 等） | 既存どおり（C20260614-002 で可視化） | 変更なし（確認→停止後に既存フロー。失敗時メッセージ維持） |
| サインアウト中のローカル wipe 失敗 | （該当なし） | wipe 失敗してもサインアウト自体は完了（best-effort）。次回起動時に owner 不一致データは表示されない（getAllByOwner で絞られる） |
| オフライン時のアカウント切替 | linkGoogle は keyless で undefined（導線非表示） | 変更なし。ローカル wipe はオフラインでも可能 |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `src/App.tsx`（LoginEndGuard） | 高 | path 起因の強制停止を撤去（直接対象） |
| `src/features/account/AccountPage.tsx` | 高 | ログイン/サインアウトの確認付き停止ゲート、停止→保存→切替の配線 |
| `src/components/auth/AuthProvider.tsx` | 高 | signOut の wipe、既存アカウント切替時の上書き wipe 配線 |
| `src/services/sync/localStore.ts`（local-sync） | 中 | `clearLocalData` 追加（ローカル限定 wipe） |
| `src/features/execution/model/executionRepo.ts` | 低 | `endInProgressNow` は流用（保存は既存。呼び出し位置のみ変更） |
| `src/services/auth/ownerContext.tsx` | 低 | OwnerState に進行中確認/wipe 連携の seam 追加（必要時） |
| 既存テスト（LoginEndGuard 前提・signOut 前提） | 中 | path 停止テストの削除/修正、wipe・確認の新規テスト |
| 横断 `_shared/local-sync` SPEC | 中 | cross-owner replace ポリシーを §6 に追記（last-write-wins と直交である旨） |

## 4. 後方互換性

- **互換維持**: ✅
  - 永続データ形状・DB スキーマ・列・owner_id 体系すべて不変。`ExecState` 形状不変。backend 契約不変。migration 不要。
  - 既存の進行中セッションは、本改修後はむしろ「`/account` 閲覧で勝手に止まらない」+ R20260614-001 の復帰導線で安全に扱える。
- **非互換変更**: なし。
- **破壊的副作用の局所性**: サインアウト/上書き時のローカル wipe は **当該 owner のデバイスローカルキャッシュ限定**。サーバ（アカウント）データは無傷で、再ログインで復元可能（O54 のセルフ全削除 `purgeAllData` とは別物）。

## 5. ロールバック方針

- **コード revert で完全復旧**: ✅（UI/配線変更 + ローカル wipe 配線のみ。DB 変更・migration なし）。revert すれば `LoginEndGuard` による path 停止に戻る。
- **DB ロールバック**: 不要（スキーマ変更なし）。
- **データ面の不可逆性に関する注意**: 本改修後にサインアウトで wipe されたデバイスローカルデータは、**連携済みアカウントならサーバから再 pull で復元可能**。ただし「未連携ゲストのまま誤ってサインアウト相当の wipe」は対象外（サインアウトは連携済み前提の導線。未連携ゲストにサインアウト導線は出ない）。

## 6. リリース戦略

- **方式**: 一括（フィーチャーフラグ不要）。停止契機の付け替え + 確認ダイアログ + ローカル wipe 配線で、低〜中リスク。
- **ロールアウト**:
  1. 実装 + 単体テスト green（`/flow:tdd`）
  2. E2E green（`/flow:e2e`：停止条件緩和 / 確認 / 連携アップロード / 上書き / サインアウト削除 + リグレッション）
  3. `/flow:design` 視覚レビュー + `/flow:wording` 文言確定（確認ダイアログ文言「計時中の活動を停止しますか」含む）
  4. 次回 release バンドルに同梱（実 Clerk キー必要な経路はローカル実機確認 → デプロイ、`/flow:release`）

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）

- **UC-ACCT-SWITCH-CONFIRM（アカウント切替時の確認）**
  - アカウント画面でユーザーが「Google でログイン」または「サインアウト」を押下。
  - `repos.execution.findInProgress()` を確認。
    - 進行中**なし** → 確認なしでそのまま切替アクションを実行。
    - 進行中**あり** → 確認ダイアログ「計時中の活動を停止しますか」を表示。
      - **OK（停止して続行）**: `endInProgressNow(now)` で進行中を **保存して終了** → 切替アクション（linkGoogle / signOut）を実行。
      - **キャンセル**: 何もしない。計時は継続し、ログイン/サインアウトは実行しない。
- **UC-ACCT-LINK（未連携 Google ログイン = アップロード）**
  - 連携先 Google が未使用（未連携）→ `createExternalAccount`（同一 userId 維持）で連携成立 → デバイスのゲストデータは owner を保ったままアカウントに帰属し、同期キューで**サーバへアップロード**される（保持）。
  - guest churn（別 userId のゲスト生成）を抑止し、データを orphan 化させない（C20260614-002 の refreshGuestTicket 経路を維持）。id が変わる経路では `reassignOwner` で付け替え（既存 dataOps）。
- **UC-ACCT-OVERWRITE（既存データ持ち Google ログイン = 上書き）**
  - 連携先 Google が既存ユーザー → `createExternalAccount` 失敗 → `signInWithGoogle` fallback で既存ユーザーへサインイン（owner 切替）。
  - **デバイスのゲストローカルデータを wipe** し、既存アカウントのサーバデータを pull してデバイスを再構成（= 上書き）。デバイスにゲストデータと account データが混在しないようにする。
- **UC-ACCT-SIGNOUT（サインアウト = デバイス削除）**
  - `clerk.signOut()` でセッション破棄 → **デバイスのローカル IndexedDB データを wipe**（`clearLocalData`）。
  - アカウント（サーバ）データは保持。再ログインで復元可能。
  - サインアウト後はフレッシュなゲスト状態（データなし）から再開。

### 7.2 入出力（新仕様）

- `AccountPage`:
  - props 追加（例）`hasInProgress?: () => Promise<boolean>` または `inProgressProbe`、`confirmStopMessage`。
  - `onLink` / `onSignOut` は「進行中確認 → （あれば）確認ダイアログ → 停止（保存）→ アクション」の順に再構成。確認 UI は既存の `confirming` パターン（削除導線で実装済）に倣う。
- `AuthProvider`:
  - `signOut = async () => { await clerk.signOut(); await clearLocalData(); }`（wipe は best-effort、失敗してもサインアウトは完了）。
  - signInWithGoogle fallback 経路で `clearLocalData(guestOwnerId)` を実行してから account データ pull。
- `localStore.clearLocalData(ownerId?)`: 指定 owner（省略時は全 owner）のローカルエンティティストアを物理削除。outbox / meta も対象。**サーバ API は呼ばない**（ローカル限定）。
- `App.tsx`: `LoginEndGuard` 削除（`isLoginPath` 起因の停止は廃止）。停止は AccountPage 経由のみ。

### 7.3 データモデル（新仕様）

変更なし。owner_id 体系・各テーブル列・`ExecState` 形状はそのまま。アカウント切替時の wipe は当該 owner スコープのローカル物理削除のみ。

### 7.4 バリデーション・エラー（新仕様）

- 進行中確認のキャンセルは切替を中止（破壊的操作を促さない）。
- `endInProgressNow` は進行中なしなら no-op（既存）。停止時の達成判定は `achievementMode: 'strict'`（有効経過>0 のみ算入、既存）。
- ローカル wipe は冪等（存在しないストアは無視）。wipe 失敗時もサインアウト完了を優先し、表示は `getAllByOwner` の owner 絞りで担保。

### 7.5 機能固有 NFR + 既存連携（新仕様）

- **auth-required / owner-scoped（SEC-001）**: wipe・上書きは現 owner / 旧 guest owner のスコープに限定。サーバ削除は伴わない（O54 の `purgeAllData` と区別）。
- **stateful（進行中単一）**: 停止は明示切替の直前のみ。owner グローバル単一進行中の不変条件（R20260614-001）を維持。
- **offline-critical / local-first**: 停止保存・ローカル wipe は IndexedDB 正本で完結しオフラインでも動作。連携アップロード/上書き pull はオンライン復帰時に同期キューが処理。
- **local-sync 連携（重要・整合）**: 定常の intra-owner 競合解決は **last-write-wins（updated_at）を維持**。本改修の「アップロード / 上書き / 削除」は **アカウント切替境界（cross-owner）** の決定的 replace であり、owner が異なるため last-write-wins のスコープ外＝直交（矛盾しない）。この区別を `_shared/local-sync` SPEC §6 に追記する。

## 8. タグ別追加項目

- **auth-required**: 確認・停止・wipe・上書きはすべて現 owner / 切替対象 owner に閉じる。サーバ側は既存 `withOwner` 契約不変。
- **offline-critical**: 停止保存・ローカル wipe はネットワーク不要。アップロード/pull は同期キュー（復帰時バッチ）。
- **stateful**: 進行中は高々 1 つ。確認は「進行中ありかつ明示切替」のときだけ発火。

## 9. 未決事項

> 現時点で論点なし（2026-06-15）。以下は実装時に確定する Class A 詳細（auto-pick）。

### [論点-001] ローカル wipe の粒度（current owner 限定 vs 全 owner）
- **影響範囲**: `localStore.clearLocalData` / signOut / 上書き
- **詰めるべき問い**: サインアウト時に削除するのは「現 owner（連携済みアカウント）のローカルデータのみ」か「端末上の全 owner ローカルデータ」か。
- **候補案**: 案A 現 owner 限定（最小・安全）。案B 全 owner wipe（端末をフレッシュゲストに完全リセット）。
- **推奨**: 案A（現 owner 限定）。要望6「デバイスのデータを削除」を満たしつつ、複数 owner が偶発的に混在しても他 owner を巻き込まない。実装時に IndexedDB の owner 横断有無を確認して確定。
- **判断期限**: tdd 着手時 / **担当**: 実装時に localStore 構造確認（auto-pick、AI_LOG 記録）

### [論点-002] 上書き時のサーバ pull 完了待ち UX
- **影響範囲**: signInWithGoogle fallback → account データ pull
- **詰めるべき問い**: 上書き（wipe → pull）中の表示（ローディング / 空表示の一瞬）をどう見せるか。
- **推奨**: 既存の同期キュー（非ブロッキング）に委ね、pull 完了までは空 or 既存ローディングで自然に埋まる方針。専用 UI は `/flow:design` 段階で必要なら追加（auto-pick、Class A）。
- **判断期限**: design 段階

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-15 | 初版作成 | /flow:revise |
