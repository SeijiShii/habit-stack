# _shared/auth 変更仕様書（セルフサービス全データ削除の UI 導線）

> **改修種別**: 機能追加（既存ロジックの UI 配線 + サーバ削除 API 新設）
> **issue / slug**: R20260611-002 / self-service-delete
> **基準 SPEC**: `../001__shared_auth_SPEC.md`
> **最終更新**: 2026-06-11
> **タグ**: auth-required, stateful, offline-critical, legal-required(O54)

---

## 1. 変更概要

プラポリ + 利用規約が約束する「アプリ内セルフサービス全データ削除（O54 消去権）」を、AccountPage に実際の UI 導線として実装する。確認ダイアログ → サーバ DB の全データ削除（`deleteAllData`、オンライン時）+ ローカル IndexedDB の wipe（`wipeOwner`）→ 完了後にフレッシュなゲスト状態へリロード。**本番公開済みアプリの法令ギャップ（履行不能な約束）を解消する**。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC-AUTH-DELETE | 削除ロジック（`deleteAllData`/`wipeOwner`）は存在するが UI 導線ゼロ。ユーザーは削除を実行できない | AccountPage に「全データを削除」導線。確認 → サーバ+ローカル削除 → フレッシュ状態へ | 約束済み消去権の履行（O54、個情法/GDPR） |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `DELETE /api/account`（新規） | 無し | owner 強制（withOwner）で `deleteAllData(db, ownerId)` を実行。200 `{deleted:true}` | 新規追加（後方互換） |
| AccountPage | サインアウト + Google 引き継ぎのみ | 上記 + 「全データを削除」セクション（確認ダイアログ付き） | 追加のみ |
| `purgeAllData(deps)`（新規・frontend） | 無し | ローカル wipe + （連携/オンライン時）削除 API 呼び出しを協調 | 新規 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| （なし） | スキーマ変更なし。既存 `deleteAllData` が owner 配下行を物理削除するのみ | **不要** |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| 削除実行 | — | 二段階確認（確認ダイアログで明示同意）してから実行。失敗時はローカル wipe を優先実行しエラー表示（オフラインでもローカルは消える） |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| _shared/auth | 高 | 削除サービス + API + AccountPage 改修 |
| _shared/legal | 中 | プラポリ N2 文言（content.ts）と整合確認（文言変更は不要、導線実装で約束を充足） |
| app-shell（App.tsx） | 中 | AccountPage に repos/store を注入する配線 |
| _shared/local-sync | 低 | `LocalStore.wipeOwner` を利用（既存メソッド） |

## 4. 後方互換性

- **互換維持**: ✅（純粋な追加。既存 API / 画面の挙動は不変）
- 非互換変更なし。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅（新規ファイル + AccountPage への追加のみ、DB 変更なし）
- **DB マイグレーションのロールバック**: 無（スキーマ変更なし）
- **手順**: 当該 commit を revert すれば削除導線が消える（データ削除は不可逆だが、機能追加のロールバックは安全）

## 6. リリース戦略

- **方式**: 一括（フィーチャーフラグ不要、法令ギャップ解消のため早期反映）
- **ロールアウト**: 未デプロイの R20260611-001（計時永続化）と合わせて release-pre full audit → secure → 再デプロイ

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）

**UC-AUTH-DELETE: 全データのセルフサービス削除**
1. ユーザーが `/account` で「全データを削除」ボタンを押す。
2. 確認 UI（「すべての記録が完全に削除されます。元に戻せません。」+ 「削除する」/「キャンセル」）を表示。
3. 「削除する」確定で `purgeAllData` を実行:
   - (a) サーバ削除: 連携済み or オンラインなら `DELETE /api/account`（withOwner で owner 強制 → `deleteAllData`）。
   - (b) ローカル削除: `LocalStore.wipeOwner(ownerId)` で IndexedDB の owner 配下を全削除 + outbox クリア。
   - (c) 完了後、トップ（`/`）へリロードしてフレッシュなゲスト状態に戻す。
4. keyless（オフライン/キー未設定ゲスト）では (a) をスキップし (b)(c) のみ（サーバにデータが無いため整合）。

### 7.2 入出力（新仕様）
- `DELETE /api/account`: 認証は `withOwner`（owner はサーバ強制、SEC-001）。body 不要。成功 `200 {deleted:true}`、未認証 `401`。
- `purgeAllData({ store, ownerId, deleteRemote })`: `deleteRemote` は「サーバ削除を試みるか」のフラグ（オンライン/連携状態から決定）。ローカル wipe は常に実行。

### 7.3 データモデル（新仕様）
- 変更なし。`deleteAllData` の OWNED_TABLES（execution_records → execution_sessions → daily_achievements → activity_items → activity_sets）順削除を流用。

### 7.4 バリデーション・エラー（新仕様）
- 確認ダイアログ未確定では削除しない。
- サーバ削除が失敗（ネットワーク等）してもローカル wipe は実行し、「ローカルのデータは削除しました。オンライン時に再度お試しください」を表示（ローカルファースト原則。ユーザーの端末からは確実に消える）。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- SEC-001（owner 強制）: 削除 API は withOwner で他人のデータを消せない。
- O54: 匿名ゲストが運営を介さず自己完結で削除できる（窓口不要）。
- offline-critical: オフラインでもローカル削除は機能する。

## 8. タグ別追加項目
- **legal-required(O54)**: プラポリ content.ts N2 文言（「アプリ内のセルフサービス機能でご自身で行えます（全データ削除はいつでも実行できます）」）が本導線で充足される。文言変更は不要。
- **offline-critical**: サーバ削除失敗時もローカル wipe を保証。

## 9. 未決事項

現時点で論点なし（2026-06-11）。サーバ削除方式は「専用 DELETE エンドポイント + 既存 `deleteAllData` 物理削除」を採用（soft-delete tombstone はサーバにデータが残り「完全削除」の約束に反するため不採用、auto-pick）。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-11 | 初版作成（AUDIT_20260611_2000 Critical 起点） | /flow:revise |
