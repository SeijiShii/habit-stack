import { openDB, type IDBPDatabase } from "idb";
import type { SyncEntity } from "../../types/sync.js";

export const ENTITY_STORES: readonly SyncEntity[] = [
  "activity_set",
  "activity_item",
  "execution_session",
  "execution_record",
  "daily_achievement",
] as const;

const DB_NAME = "habit-stack";
const DB_VERSION = 1;
const OUTBOX = "outbox";
const META = "meta";

/** local-first 保存対象レコードの最小契約（同期メタ含む）。 */
export interface LocalRecord {
  id: string;
  ownerId: string;
  clientLocalId: string;
  updatedAt: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

export interface OutboxItem {
  seq?: number;
  entity: SyncEntity;
  op: "upsert" | "delete";
  payload: LocalRecord;
  clientLocalId: string;
  updatedAt: string;
}

export async function openLocalDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      for (const store of ENTITY_STORES) {
        if (!db.objectStoreNames.contains(store)) {
          const os = db.createObjectStore(store, { keyPath: "id" });
          os.createIndex("ownerId", "ownerId");
        }
      }
      if (!db.objectStoreNames.contains(OUTBOX)) {
        db.createObjectStore(OUTBOX, { keyPath: "seq", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: "key" });
      }
    },
  });
}

/**
 * local-first ストア。書き込みは即ローカル成功 + outbox 積み（オフライン可、offline-critical）。
 */
export class LocalStore {
  constructor(private readonly db: IDBPDatabase) {}

  static async open(): Promise<LocalStore> {
    return new LocalStore(await openLocalDb());
  }

  /** ローカル保存 + outbox に upsert を積む。 */
  async put(entity: SyncEntity, record: LocalRecord): Promise<void> {
    await this.db.put(entity, record);
    await this.db.add(OUTBOX, {
      entity,
      op: "upsert",
      payload: record,
      clientLocalId: record.clientLocalId,
      updatedAt: record.updatedAt,
    } satisfies Omit<OutboxItem, "seq">);
  }

  async get(entity: SyncEntity, id: string): Promise<LocalRecord | undefined> {
    return this.db.get(entity, id) as Promise<LocalRecord | undefined>;
  }

  /** owner の未削除レコードのみ返す。 */
  async getAllByOwner(
    entity: SyncEntity,
    ownerId: string,
  ): Promise<LocalRecord[]> {
    const all = (await this.db.getAllFromIndex(
      entity,
      "ownerId",
      ownerId,
    )) as LocalRecord[];
    return all.filter((r) => r.deletedAt == null);
  }

  /** 論理削除（tombstone）。outbox に delete を積み、削除も同期。 */
  async softDelete(
    entity: SyncEntity,
    id: string,
    deletedAt: string,
  ): Promise<void> {
    const rec = (await this.db.get(entity, id)) as LocalRecord | undefined;
    if (!rec) return;
    const tombstoned = { ...rec, deletedAt, updatedAt: deletedAt };
    await this.db.put(entity, tombstoned);
    await this.db.add(OUTBOX, {
      entity,
      op: "delete",
      payload: tombstoned,
      clientLocalId: rec.clientLocalId,
      updatedAt: deletedAt,
    } satisfies Omit<OutboxItem, "seq">);
  }

  /** クライアント内メタ値（migration フラグ等、同期対象外）。 */
  async getMeta(key: string): Promise<unknown> {
    const rec = (await this.db.get(META, key)) as
      | { key: string; value: unknown }
      | undefined;
    return rec?.value;
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    await this.db.put(META, { key, value });
  }

  /** サーバ由来の変更をローカルへ適用する（outbox には積まない、pull 用）。 */
  async applyRemote(entity: SyncEntity, record: LocalRecord): Promise<void> {
    await this.db.put(entity, record);
  }

  /** 未同期 outbox を取得。 */
  async drainOutbox(): Promise<OutboxItem[]> {
    return (await this.db.getAll(OUTBOX)) as OutboxItem[];
  }

  /** 同期済みの outbox を消す。 */
  async clearOutbox(seqs: number[]): Promise<void> {
    const tx = this.db.transaction(OUTBOX, "readwrite");
    await Promise.all(seqs.map((s) => tx.store.delete(s)));
    await tx.done;
  }

  /**
   * owner 配下の全ローカルデータを消す（O54 セルフサービス削除のローカル側）。
   * entity ストアに加え、当該 owner の未送信 outbox も消す（削除後に再 push で復活させない）。
   */
  async wipeOwner(ownerId: string): Promise<void> {
    for (const entity of ENTITY_STORES) {
      const recs = (await this.db.getAllFromIndex(
        entity,
        "ownerId",
        ownerId,
      )) as LocalRecord[];
      const tx = this.db.transaction(entity, "readwrite");
      await Promise.all(recs.map((r) => tx.store.delete(r.id)));
      await tx.done;
    }
    // owner の未送信 outbox を除去（payload.ownerId で判定）。
    const items = (await this.db.getAll(OUTBOX)) as (OutboxItem & {
      seq: number;
    })[];
    const ownSeqs = items
      .filter(
        (it) => (it.payload as LocalRecord | undefined)?.ownerId === ownerId,
      )
      .map((it) => it.seq);
    if (ownSeqs.length > 0) {
      const tx = this.db.transaction(OUTBOX, "readwrite");
      await Promise.all(ownSeqs.map((s) => tx.store.delete(s)));
      await tx.done;
    }
  }

  /**
   * ローカルの owner を付け替える（破棄せず保全）。fromOwner の全エンティティを toOwner へ移し、
   * 付け替え後の状態を outbox に upsert として積んでサーバへ反映する。旧 owner 宛の未送信 outbox は
   * 付け替え後の upsert が代替するため除去する（旧 owner で push されないように）。サーバ API は呼ばない。
   * [論点-009] reassignOwner（サーバ側）のローカル対応（C20260616-001）。
   */
  async reassignOwnerLocal(
    fromOwnerId: string,
    toOwnerId: string,
  ): Promise<void> {
    if (fromOwnerId === toOwnerId) return;
    for (const entity of ENTITY_STORES) {
      const recs = (await this.db.getAllFromIndex(
        entity,
        "ownerId",
        fromOwnerId,
      )) as LocalRecord[];
      for (const r of recs) {
        const moved = { ...r, ownerId: toOwnerId };
        await this.db.put(entity, moved);
        await this.db.add(OUTBOX, {
          entity,
          op: "upsert",
          payload: moved,
          clientLocalId: r.clientLocalId,
          updatedAt: r.updatedAt,
        } satisfies Omit<OutboxItem, "seq">);
      }
    }
    // 旧 owner 宛の未送信 outbox を除去（上の upsert が新 owner で代替するため）。
    const items = (await this.db.getAll(OUTBOX)) as (OutboxItem & {
      seq: number;
    })[];
    const staleSeqs = items
      .filter(
        (it) =>
          (it.payload as LocalRecord | undefined)?.ownerId === fromOwnerId,
      )
      .map((it) => it.seq);
    if (staleSeqs.length > 0) {
      const tx = this.db.transaction(OUTBOX, "readwrite");
      await Promise.all(staleSeqs.map((s) => tx.store.delete(s)));
      await tx.done;
    }
  }

  /**
   * current owner 以外の全 owner のローカルデータを current owner へ付け替えて保全する
   * （既存アカウントへのサインイン時、デバイスのゲストデータを失わずアカウントへ引き継ぐ。
   * concept §1.1 UC8「データを引き継ぎたいときにログイン」）。
   * 旧実装 `wipeOtherOwners` は entity + 未送信 outbox を物理削除してデータを恒久喪失させていた
   * （C20260616-001 のデータ消失バグ）。本実装は破棄せず付け替える（last-write-wins で競合解決）。
   * OAuth リダイレクトで切替境界では同期処理できないため、サインイン復帰後にこれを呼ぶ。
   * 注意: 単なるゲスト churn では呼ばないこと。呼び出しは「明示的な既存アカウントサインイン」
   * マーカー（deviceOverwrite）でガードする。
   */
  async reassignOtherOwnersTo(currentOwnerId: string): Promise<void> {
    const others = new Set<string>();
    for (const entity of ENTITY_STORES) {
      const all = (await this.db.getAll(entity)) as LocalRecord[];
      for (const r of all) {
        if (r.ownerId && r.ownerId !== currentOwnerId) others.add(r.ownerId);
      }
    }
    for (const oid of others) {
      await this.reassignOwnerLocal(oid, currentOwnerId);
    }
  }
}
