import type {
  LocalStore,
  LocalRecord,
} from "../../../services/sync/localStore.js";
import type { OwnerId } from "../../../types/domain.js";
import type { AchievementDay } from "./summarize.js";
import { aggregateSetTotals, type SetTotal } from "./overview.js";
import { buildActivities, type Activity } from "./activities.js";

/**
 * 達成日（daily_achievement、キャッシュ）を読み取る。
 * 認証時はサーバ集計も可だが、匿名はローカルから集計（offline、SPEC §1）。
 */
export class SummaryRepo {
  constructor(
    private readonly store: LocalStore,
    private readonly ownerId: OwnerId,
  ) {}

  async getAchievements(
    setId: string,
    start: string,
    end: string,
  ): Promise<AchievementDay[]> {
    const all = (await this.store.getAllByOwner(
      "daily_achievement",
      this.ownerId,
    )) as LocalRecord[];
    return all
      .filter(
        (a) =>
          a.setId === setId &&
          typeof a.date === "string" &&
          a.date >= start &&
          a.date <= end &&
          a.achieved === true,
      )
      .map((a) => ({
        date: a.date as string,
        itemDoneCount: (a.itemDoneCount as number) ?? 1,
      }));
  }

  /** 指定セットの達成日を全期間ぶん返す（全期間 遂行率の起点算出に使う）。 */
  async getAllAchievements(setId: string): Promise<AchievementDay[]> {
    const all = (await this.store.getAllByOwner(
      "daily_achievement",
      this.ownerId,
    )) as LocalRecord[];
    return all
      .filter(
        (a) =>
          a.setId === setId &&
          typeof a.date === "string" &&
          a.achieved === true,
      )
      .map((a) => ({
        date: a.date as string,
        itemDoneCount: (a.itemDoneCount as number) ?? 1,
      }));
  }

  /**
   * 指定セットの「1回の活動」一覧（セッション単位、直近順）。
   * 各活動は item 別の経過時間・メモを持つ（折りたたみで展開、owner スコープ）。
   */
  async getActivities(setId: string): Promise<Activity[]> {
    const sessions = (
      await this.store.getAllByOwner("execution_session", this.ownerId)
    ).filter((s) => s.setId === setId);
    const records = await this.store.getAllByOwner(
      "execution_record",
      this.ownerId,
    );
    const items = (
      await this.store.getAllByOwner("activity_item", this.ownerId)
    )
      .filter((i) => i.setId === setId)
      .map((i) => ({ id: i.id, name: i.name }));
    return buildActivities(sessions, records, items);
  }

  /** 全期間累計の setId/itemId 別実行時間（UC6-OV、owner スコープ・未削除のみ）。 */
  async getSetTotals(): Promise<SetTotal[]> {
    const sessions = await this.store.getAllByOwner(
      "execution_session",
      this.ownerId,
    );
    const records = await this.store.getAllByOwner(
      "execution_record",
      this.ownerId,
    );
    return aggregateSetTotals(sessions, records);
  }
}
