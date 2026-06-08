import type { LocalStore, LocalRecord } from '../../../services/sync/localStore.js';
import type { OwnerId } from '../../../types/domain.js';
import type { AchievementDay } from './summarize.js';

/**
 * 達成日（daily_achievement、キャッシュ）を読み取る。
 * 認証時はサーバ集計も可だが、匿名はローカルから集計（offline、SPEC §1）。
 */
export class SummaryRepo {
  constructor(
    private readonly store: LocalStore,
    private readonly ownerId: OwnerId,
  ) {}

  async getAchievements(setId: string, start: string, end: string): Promise<AchievementDay[]> {
    const all = (await this.store.getAllByOwner('daily_achievement', this.ownerId)) as LocalRecord[];
    return all
      .filter(
        (a) =>
          a.setId === setId &&
          typeof a.date === 'string' &&
          a.date >= start &&
          a.date <= end &&
          a.achieved === true,
      )
      .map((a) => ({
        date: a.date as string,
        itemDoneCount: (a.itemDoneCount as number) ?? 1,
      }));
  }
}
