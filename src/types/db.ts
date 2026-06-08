/**
 * DB 由来型を意味名で再エクスポート（_shared/db の Drizzle 推論型を集約供給）。
 * types は db に一方向依存（循環なし）。
 */
import type {
  activitySets,
  activityItems,
  executionSessions,
  executionRecords,
  dailyAchievements,
} from '../../db/schema.js';

export type ActivitySet = typeof activitySets.$inferSelect;
export type ActivitySetInsert = typeof activitySets.$inferInsert;

export type ActivityItem = typeof activityItems.$inferSelect;
export type ActivityItemInsert = typeof activityItems.$inferInsert;

export type ExecutionSession = typeof executionSessions.$inferSelect;
export type ExecutionSessionInsert = typeof executionSessions.$inferInsert;

export type ExecutionRecord = typeof executionRecords.$inferSelect;
export type ExecutionRecordInsert = typeof executionRecords.$inferInsert;

export type DailyAchievement = typeof dailyAchievements.$inferSelect;
export type DailyAchievementInsert = typeof dailyAchievements.$inferInsert;
