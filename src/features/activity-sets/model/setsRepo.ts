import { LocalStore, type LocalRecord } from '../../../services/sync/localStore.js';
import type { OwnerId, TimeOfDay } from '../../../types/domain.js';
import { setInputSchema, itemInputSchema, type SetInput, type ItemInput } from './schema.js';

export interface SetRecord extends LocalRecord {
  name: string;
  timeOfDay: TimeOfDay;
  sortOrder: number;
}
export interface ItemRecord extends LocalRecord {
  setId: string;
  name: string;
  sortOrder: number;
}

export interface RepoDeps {
  now?: () => string;
  genId?: () => string;
  genLocalId?: () => string;
}

/**
 * 活動セット / アイテムの CRUD。全書き込みは local-sync 経由（offline-critical）、
 * owner は useOwner 由来をクライアントが付与するが、サーバ同期時は withOwner で再強制（SEC-001）。
 * 入力は Zod 検証（SEC-002）。
 */
export class SetsRepo {
  private readonly now: () => string;
  private readonly genId: () => string;
  private readonly genLocalId: () => string;

  constructor(
    private readonly store: LocalStore,
    private readonly ownerId: OwnerId,
    deps: RepoDeps = {},
  ) {
    this.now = deps.now ?? (() => new Date().toISOString());
    this.genId = deps.genId ?? (() => crypto.randomUUID());
    this.genLocalId = deps.genLocalId ?? (() => crypto.randomUUID());
  }

  private base() {
    const t = this.now();
    return {
      ownerId: this.ownerId,
      clientLocalId: this.genLocalId(),
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
  }

  async createSet(input: SetInput, sortOrder = 0): Promise<SetRecord> {
    const v = setInputSchema.parse(input);
    const record: SetRecord = { id: this.genId(), ...this.base(), ...v, sortOrder };
    await this.store.put('activity_set', record);
    return record;
  }

  async updateSet(rec: SetRecord, patch: Partial<SetInput>): Promise<SetRecord> {
    const v = setInputSchema.partial().parse(patch);
    const next: SetRecord = { ...rec, ...v, updatedAt: this.now() };
    await this.store.put('activity_set', next);
    return next;
  }

  async deleteSet(id: string): Promise<void> {
    const t = this.now();
    // 配下アイテムも softDelete
    const items = (await this.store.getAllByOwner('activity_item', this.ownerId)) as ItemRecord[];
    for (const item of items.filter((i) => i.setId === id)) {
      await this.store.softDelete('activity_item', item.id, t);
    }
    await this.store.softDelete('activity_set', id, t);
  }

  async listSets(): Promise<SetRecord[]> {
    const sets = (await this.store.getAllByOwner('activity_set', this.ownerId)) as SetRecord[];
    return sets.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async createItem(setId: string, input: ItemInput, sortOrder = 0): Promise<ItemRecord> {
    const v = itemInputSchema.parse(input);
    const record: ItemRecord = { id: this.genId(), ...this.base(), setId, ...v, sortOrder };
    await this.store.put('activity_item', record);
    return record;
  }

  async listItems(setId: string): Promise<ItemRecord[]> {
    const items = (await this.store.getAllByOwner('activity_item', this.ownerId)) as ItemRecord[];
    return items.filter((i) => i.setId === setId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async deleteItem(id: string): Promise<void> {
    await this.store.softDelete('activity_item', id, this.now());
  }

  async saveOrder(entity: 'activity_set' | 'activity_item', changed: LocalRecord[]): Promise<void> {
    for (const rec of changed) {
      await this.store.put(entity, { ...rec, updatedAt: this.now() });
    }
  }
}
