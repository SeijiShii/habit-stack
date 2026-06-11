# _shared/auth 単体テスト計画（セルフサービス全データ削除）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 `../003__shared_auth_UNIT_TEST.md` / `dataOps.test.ts` / `localStore.test.ts`
> **最終更新**: 2026-06-11

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U-DEL-01 | `api/account/delete` makeDeleteHandler | 認証済み owner で DELETE | `deleteAllData(db, owner)` が呼ばれ `200 {deleted:true}` |
| U-DEL-02 | `purgeAllData` | `{store, ownerId, deleteRemote:true}`、fetch 成功 | `wipeOwner(ownerId)` 実行 + `DELETE /api/account` 呼び出し、resolve |
| U-DEL-03 | `purgeAllData` | `deleteRemote:false`（guest） | `wipeOwner` のみ実行、fetch 呼ばない |
| U-DEL-04 | AccountPage | 削除ボタン押下 → 確認「削除する」 | `purgeAllData` 呼び出し → リロード（location 遷移 mock 検証） |
| U-DEL-05 | AccountPage | 削除ボタン押下 → 確認「キャンセル」 | `purgeAllData` 呼ばれない |
| U-DEL-06 | LocalStore.wipeOwner | owner の session/record/achievement/set/item を put 後 wipe | 全 entity で owner 配下 0 件 + outbox に owner 残骸なし |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U-DEL-07 | `api/account/delete` | 未認証（owner 解決不可） | `401`、`deleteAllData` 呼ばれない |
| U-DEL-08 | `purgeAllData` | fetch（リモート削除）失敗 | `wipeOwner` は完了し、リモート失敗を呼び出し元へ通知（reject or 結果フラグ）。ローカルは確実に消える |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U-DEL-09 | `deleteAllData` | データ 0 件の owner | エラーなく完了（冪等） |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| （AccountPage.test.tsx 既存） | 連携/サインアウト/ゲスト表示 | 既存アサート維持 | 削除セクション追加分のレンダリングを追加検証 | 既存挙動は不変、追加分のみ |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| （なし） | — | — |

## 4. リグレッション強化
- 既存 167 テスト維持。AccountPage の既存 3 状態（連携済 / 未連携リンク可 / keyless）表示が不変。
- `deleteAllData` / `wipeOwner` の既存テストは保持。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| fetch | — | `DELETE /api/account` を vi.fn でモック | purgeAllData のリモート分岐検証 |
| window.location | — | reload/assign をモック | 削除後フレッシュ遷移の検証 |
| db (Drizzle) | dataOps.test 既存パターン | 流用 | delete ハンドラ |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承（deleteRemote 分岐 / 確認分岐を網羅） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-11 | 初版作成 | /flow:revise |
