import type { ContinuationRate } from '../../../types/domain.js';

export interface AchievementDay {
  date: string; // YYYY-MM-DD
  itemDoneCount: number;
}

export interface Dot {
  date: string;
  achieved: boolean;
}

export interface Summary extends ContinuationRate {
  /** 直近から連続して達成した日数（手応え、途切れを咎めない）。 */
  currentStreak: number;
  dots: Dot[];
  isEmpty: boolean;
}

/** start..end（含む、YYYY-MM-DD）の日付配列を返す。 */
export function enumerateDates(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  while (d.getTime() <= last.getTime()) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/**
 * 達成日から継続サマリを算出する（純関数）。
 * 継続率 = 達成日数 / 対象日数（対象日数はセット存在期間 ∩ 指定期間 = dates、SPEC R1）。
 * 穴あき許容（1 アイテム以上実行 = 達成、achievements に存在）。
 * 未達は咎めず空ドットで中立表現（[論点-001] / charter §2.2）。
 */
export function summarize(achievements: AchievementDay[], dates: string[]): Summary {
  const achievedSet = new Set(achievements.map((a) => a.date));
  const dots: Dot[] = dates.map((date) => ({ date, achieved: achievedSet.has(date) }));
  const achievedDays = dots.filter((d) => d.achieved).length;
  const totalDays = dots.length;

  // 直近から連続達成（末尾から遡る）
  let currentStreak = 0;
  for (let i = dots.length - 1; i >= 0; i--) {
    if (dots[i]!.achieved) currentStreak++;
    else break;
  }

  return {
    achievedDays,
    totalDays,
    rate: totalDays === 0 ? 0 : achievedDays / totalDays,
    currentStreak,
    dots,
    isEmpty: achievedDays === 0,
  };
}
