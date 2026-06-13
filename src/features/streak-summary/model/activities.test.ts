import { describe, it, expect } from "vitest";
import { buildActivities } from "./activities.js";

const items = [
  { id: "i1", name: "腕立て" },
  { id: "i2", name: "腹筋" },
];

describe("buildActivities", () => {
  it("セッション単位に組み立て、合計秒・アイテム名・メモを持つ", () => {
    const sessions = [
      { id: "s1", clientLocalId: "s1", setId: "set_a", startedAt: "2026-06-12T01:00:00.000Z" },
    ];
    const records = [
      { sessionId: "s1", itemId: "i1", elapsedSec: 600, note: "きつかった" },
      { sessionId: "s1", itemId: "i2", elapsedSec: 480, note: "" },
    ];
    const out = buildActivities(sessions, records, items);
    expect(out).toHaveLength(1);
    expect(out[0]!.sessionId).toBe("s1");
    expect(out[0]!.totalSec).toBe(1080);
    expect(out[0]!.records).toEqual([
      { itemId: "i1", itemName: "腕立て", elapsedSec: 600, note: "きつかった" },
      { itemId: "i2", itemName: "腹筋", elapsedSec: 480, note: "" },
    ]);
  });

  it("開始時刻の新しい順に並ぶ（直近が先頭）", () => {
    const sessions = [
      { id: "old", clientLocalId: "old", setId: "set_a", startedAt: "2026-06-10T01:00:00.000Z" },
      { id: "new", clientLocalId: "new", setId: "set_a", startedAt: "2026-06-13T01:00:00.000Z" },
    ];
    const records = [
      { sessionId: "old", itemId: "i1", elapsedSec: 60 },
      { sessionId: "new", itemId: "i1", elapsedSec: 60 },
    ];
    const out = buildActivities(sessions, records, items);
    expect(out.map((a) => a.sessionId)).toEqual(["new", "old"]);
  });

  it("合計 0 秒のセッション（記録なし / 0 秒放置）は並べない", () => {
    const sessions = [
      { id: "empty", clientLocalId: "empty", setId: "set_a", startedAt: "2026-06-12T01:00:00.000Z" },
      { id: "zero", clientLocalId: "zero", setId: "set_a", startedAt: "2026-06-11T01:00:00.000Z" },
    ];
    const records = [{ sessionId: "zero", itemId: "i1", elapsedSec: 0 }];
    expect(buildActivities(sessions, records, items)).toHaveLength(0);
  });

  it("他セッションの record は混入しない", () => {
    const sessions = [
      { id: "s1", clientLocalId: "s1", setId: "set_a", startedAt: "2026-06-12T01:00:00.000Z" },
    ];
    const records = [
      { sessionId: "s1", itemId: "i1", elapsedSec: 600 },
      { sessionId: "other", itemId: "i2", elapsedSec: 999 },
    ];
    const out = buildActivities(sessions, records, items);
    expect(out[0]!.records.map((r) => r.itemId)).toEqual(["i1"]);
    expect(out[0]!.totalSec).toBe(600);
  });
});
