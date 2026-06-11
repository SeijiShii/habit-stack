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
}
